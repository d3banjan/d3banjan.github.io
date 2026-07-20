---
title: 'Butterflow: Pinning Agent Behavior with a Spec DSL'
description: 'Agent evals that actually catch regressions: a Python flow/expect DSL for deterministic assertions, Arize Phoenix for fuzzy semantic evals, and cache-cluster grouping for token savings.'
pubDate: 'May 04 2026'
tags: ["ai-agents", "developer-tools", "software-engineering", "llm", "evals"]
provenance: human-research-ai-written
---

The problem with testing AI agents is not that they are nondeterministic. It is that most eval frameworks give up too early on the deterministic parts and too late on the fuzzy parts.

When a billing router fails to call `lookup_invoice`, that is a hard regression. You do not need a language model to judge it. But when the final response tone shifts from confident to hedging after a fine-tune, a regex cannot catch it. Those two failure modes call for different tools — and most frameworks either use LLM-as-judge for everything (slow and expensive) or regex-only (misses semantic drift).

[Butterflow](https://github.com/d3banjan/butterflow) uses both in one spec, with explicit boundaries between them.

---

## The spec

The unit of work in Butterflow is a `flow` — a named scenario with a typed input, a sequence of `expect` assertions, and optional metadata like a `subset` tag for partial runs.

```python
from butterflow import expect, flow

with flow("refund happy path", subset="happy") as f:
    f.intent("A valid invoice refund is routed to billing and completed.")
    f.input("I need a refund for invoice 123")
    f.expect(expect.agent("router").selects("billing"))
    f.expect(expect.tool("lookup_invoice").called_with(invoice_id="123"))
    f.expect(expect.tool("issue_refund").called())
    f.expect(expect.final_response().contains("refund has been issued"))
```

This is plain Python. No YAML schema to learn, no decorator magic, no test runner discovery convention. The assertions are typed — `agent("router").selects("billing")` checks the handoff target, `tool("lookup_invoice").called_with(...)` checks the argument, `final_response().contains(...)` checks the string. The `intent` line is documentation: it is what a human reviewer reads to judge whether the spec is testing the right thing.

Every assertion in the example above is **deterministic**. Either the router picked billing or it did not. Either the tool was called with `invoice_id="123"` or it was not. Butterflow evaluates these by replaying the agent's event trace — no second LLM call, no latency, no cost.

---

## When deterministic assertions are not enough

Deterministic assertions cover routing, tool calls, and string containment. They do not cover:

- "Is the response factually grounded in the retrieved documents?"
- "Did the tone stay neutral, or did it apologize excessively?"
- "Is the explanation at the right abstraction level for a non-technical user?"

For these, you need a judge. Butterflow integrates with [Arize Phoenix](https://phoenix.arize.com/) for LLM-as-judge evals via its OpenInference-compatible span export.

```python
from butterflow import expect, flow
from butterflow.phoenix import fuzzy

with flow("refund explanation quality") as f:
    f.intent("Explanation is grounded and appropriately confident.")
    f.input("Why was my refund declined?")
    f.expect(expect.final_response().passes(
        fuzzy.groundedness(threshold=0.8),
    ))
    f.expect(expect.final_response().passes(
        fuzzy.tone(target="neutral-confident", threshold=0.75),
    ))
```

`fuzzy.groundedness` uses Phoenix's `HallucinationEvaluator` — it sends the retrieved context and the response to a judge model and returns a score. `fuzzy.tone` goes through the same Phoenix machinery, but with a custom template instead of a built-in evaluator: a `ClassificationTemplate` run through `llm_classify`. The template shows the judge the final response alongside the target descriptor — here, `neutral-confident` — and the rails constrain the judge's output to a fixed label set, so it classifies rather than free-associates. Each label maps to a score, and that score is what the threshold compares against. The point of building on `llm_classify` instead of a bare prompt is the rails: without them, judge models drift into prose, and prose does not convert to a pass/fail gate. Both evaluators return a float; Butterflow converts it to pass/fail at the configured threshold.

The split is explicit in the spec. A reviewer reading a `flow` knows immediately which assertions are structural (no external calls, no cost) and which are semantic (judge model, latency, non-zero cost). The deterministic ones run first; if they fail, the fuzzy ones are skipped — no point judging tone if the wrong tool was called.

---

## What the spec pins

Writing a spec for a scenario forces you to make concrete decisions that exploratory testing leaves vague.

**Tool arguments.** `expect.tool("lookup_invoice").called_with(invoice_id="123")` is a regression gate. After any change to the invoice lookup logic, this assertion will tell you whether the parameter binding changed. Without a spec, the only way to know is to manually inspect a trace.

**Routing decisions.** `expect.agent("router").selects("billing")` pins the handoff. If a new system prompt changes the routing logic and billing intents start going to "general support", this fails. Without a spec, that regression ships and shows up in metrics a week later.

**Response semantics.** `fuzzy.groundedness(threshold=0.8)` pins that the model is not hallucinating explanations it cannot support. After a retrieval change, if the model starts generating plausible-sounding but ungrounded text, this fails. Without a fuzzy eval, it passes all string checks.

The spec does not pin *how* the agent achieves the outcome. It pins *what* the outcome must be. That distinction matters: the spec survives refactors of the agent internals as long as the observable behavior holds.

---

## Token savings

Running evals against live LLMs is expensive if done naively. Butterflow cuts costs in three places.

### Grouping flows by shared prompt prefix

```
butterflow plan examples/ --show-cache-clusters
```

This command groups flows by shared prompt prefix. Flows that share the same system prompt, the same tool definitions, and the same first turn of conversation can reuse the KV cache of that common prefix across calls. Butterflow shows you which flows can be batched into the same cache group:

```
Cache cluster A [system_prompt_v2, tools_v4]:
  - refund happy path
  - refund declined — insufficient balance
  - refund declined — outside window
  Estimated prefix tokens: 1,847
  Flows in cluster: 3
  Cache savings: ~5,541 tokens (3 reuses of prefix)
```

Without cache-cluster grouping, each flow pays the full prefix cost. With it, the prefix is charged once and the KV cache is reused across all flows in the cluster. For eval suites where many flows share the same system prompt (which is almost every suite), this is the largest single cost reduction.

### Running tagged subsets, not samples

```
butterflow run examples/ --subset happy
```

Runs only flows tagged `subset="happy"`. This is not sampling — it runs the exact flows tagged for that subset, deterministically. During development, you run the happy path after each change. The full suite runs in CI. `--subset` is not an approximation of correctness; it is a structured triage tool that matches the development workflow.

### Estimating spend before the run

Before any run, `butterflow plan` estimates token cost per flow, groups by cache cluster, and shows the total estimated spend. If the estimate exceeds the configured budget, it asks for confirmation. This prevents the failure mode where a 200-flow batch starts fine and hits the rate ceiling an hour in, producing a partial result that cannot be used.

The planner's estimates are not tight. They use the input schema and prompt templates without running the agent. But they are directionally correct, and catching a 10× budget overage before the run is more valuable than a perfect estimate after it fails.

---

## Adapter coverage

Butterflow ships adapters for the major frameworks — LangChain, OpenAI Agents SDK, raw Anthropic SDK, and a generic OpenInference adapter for anything that emits compatible spans. Each adapter normalizes the framework's event stream into a common schema: `AgentHandoff`, `ToolCall`, `ToolResult`, `FinalResponse`.

The `expect` assertions run against this normalized schema, not against the raw framework output. This means a spec written for an OpenAI Agents SDK run can be applied to a LangChain run of the same agent without changing the assertions — only the adapter tag changes.

```python
with flow("refund happy path", adapter="openai-agents") as f:
    ...

# Same spec, different adapter:
with flow("refund happy path", adapter="langchain") as f:
    ...
```

Cross-adapter comparison — "does this spec pass under both frameworks?" — is the cheapest way to confirm that an assertion is testing the behavior and not the framework implementation detail.

---

## What I learned

The most useful property of a spec-first eval suite is that failure is *informative*.

When a test framework runs a trace and checks an assertion, a failure tells you which assertion failed and why. When an exploratory eval run "does not look right," you have to dig into logs to find out what changed. The spec makes the failure crisp before you look at a single trace.

The Arize Phoenix integration added semantic coverage that I would not have caught with deterministic assertions alone. But it also made the cost structure explicit — fuzzy evals are not free, and putting them behind deterministic gates means you pay for them only when the structural properties hold. That ordering is the right default for almost every eval scenario.

The token savings from cache clustering were larger than I expected. For a suite of 24 flows sharing one system prompt and one tool definition set, the prefix was about 1,800 tokens. Running all 24 naively costs 24 × 1,800 = 43,200 prefix tokens. With cache clustering, it costs 1,800 for the first and negligible for the rest. At scale, the planner does not just prevent budget overruns — it changes which evals are economically viable to run continuously.

---

*Butterflow is at [github.com/d3banjan/butterflow](https://github.com/d3banjan/butterflow). The `examples/` directory has annotated flows for the refund scenario above.*
