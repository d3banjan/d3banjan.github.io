---
title: 'Desktop Polish: DankMaterialShell and the Perfect Rofi Launcher'
description: 'Unifying desktop aesthetics across shell, launcher, and compositor with shared color tokens and consistent IPC patterns.'
pubDate: 'Jan 04 2026'
---

## The Integration Problem

A Wayland desktop has many components:
- Compositor (Niri)
- Desktop shell (panel, system tray)
- App launcher
- Notifications
- Lock screen

Each is a separate project with its own design language. Making them feel unified requires intentional coordination.

## DankMaterialShell: The Shell Layer

[DankMaterialShell](https://github.com/danknil/DankMaterialShell) (DMS) is a Quickshell-based desktop shell. It provides:
- Top panel with workspaces, systray, clock
- Power menu
- App spotlight
- Clipboard history

**Why DMS:** It uses Material Design 3 tokens, which provides a coherent design language. It also works on both Hyprland and Niri—compositor agnostic.

### IPC: The Control Pattern

DMS exposes functionality via IPC. This is the same pattern as Kitty's remote control: the shell is a server, scripts are clients.

```bash
dms ipc call powermenu toggle    # Power menu
dms ipc call spotlight toggle    # App launcher
dms ipc call clipboard toggle    # Clipboard history
dms ipc call settings toggle     # Settings panel
```

**The benefit:** Compositor keybindings can trigger shell features without coupling.

```kdl
// In niri config
Mod+X { spawn-sh "dms ipc call powermenu toggle"; }
```

The compositor doesn't know about DMS internals. It just calls an IPC command. Tomorrow I could replace DMS with something else, and the keybinding still works if it exposes the same IPC.

## Rofi: The Launcher Layer

DMS has a built-in launcher (spotlight), but I prefer Rofi for its flexibility and speed.

**The challenge:** Making Rofi visually match DMS.

### Design Goals

1. **Fullscreen grid** — Like macOS Launchpad
2. **Matching colors** — Same palette as DMS (Catppuccin Mocha)
3. **Selection highlight** — Use Niri's focus ring color for consistency

### Color Coordination

I extracted colors from DMS's theme and Niri's focus ring:

| Element | Color | Source |
|---------|-------|--------|
| Background | `#1a1a1a` @ 90% | Neutral (not pure black) |
| Text | `#cdd6f4` | Catppuccin `text` |
| Subtext | `#a6adc8` | Catppuccin `subtext0` |
| Selection | `#7fc8ff` | Niri `focus-ring.active-color` |
| Border | `#45475a` | Catppuccin `surface1` |

**The insight:** Using Niri's focus ring color for selection means the launcher's selection matches window focus everywhere. Visual consistency without thinking.

<details>
<summary>Rofi theme: ~/.config/rofi/themes/launchpad.rasi</summary>

```css
* {
    font: "Hack Nerd Font 10";

    bg0: #1a1a1ae6;
    bg1: #313244;
    bg2: #45475a80;
    bg3: #45475a;
    bg4: #7fc8ffe6;  /* Niri focus-ring color */

    fg0: #cdd6f4;
    fg1: #a6adc8;

    background-color: transparent;
    text-color: @fg0;
}

window {
    fullscreen: true;
    padding: 1em;
    background-color: @bg0;
}

inputbar {
    background-color: @bg2;
    margin: 0px calc( 50% - 160px );
    padding: 8px 12px;
    border: 2px;
    border-radius: 12px;
    border-color: @bg3;
    children: [icon-search, entry];
}

icon-search {
    expand: false;
    filename: "search";
}

entry {
    placeholder: "Search apps...";
    placeholder-color: @fg1;
}

listview {
    margin: 48px calc( 50% - 560px );
    spacing: 32px;
    columns: 6;
    fixed-columns: true;
}

element {
    padding: 12px;
    orientation: vertical;
    border-radius: 12px;
}

element selected {
    background-color: @bg4;
}

element-icon {
    size: 64px;
    horizontal-align: 0.5;
}

element-text {
    horizontal-align: 0.5;
}
```

</details>

### Arrow Key Navigation

By default, Rofi uses arrow keys for text cursor movement. For a grid, we want them to navigate the grid:

```bash
rofi -show drun -show-icons \
  -kb-move-char-back "" \
  -kb-move-char-forward "" \
  -kb-row-left "Left" \
  -kb-row-right "Right" \
  -theme ~/.config/rofi/themes/launchpad.rasi
```

**The tradeoff:** Text cursor movement moves to `Ctrl+B/F`. Acceptable for a launcher where you rarely need cursor positioning.

## Niri Integration

Bind Rofi in Niri with the full options:

```kdl
Mod+R hotkey-overlay-title="App Launcher" {
    spawn "rofi" "-show" "drun" "-show-icons"
          "-kb-move-char-back" ""
          "-kb-move-char-forward" ""
          "-kb-row-left" "Left"
          "-kb-row-right" "Right"
          "-theme" "~/.config/rofi/themes/launchpad.rasi";
}
```

## The Consistency Pattern

Looking across all components:

| Component | Selection Color | Source |
|-----------|-----------------|--------|
| Niri focus ring | `#7fc8ff` | Native |
| Rofi selection | `#7fc8ff` | Matched to Niri |
| DMS highlights | Material Blue | Native (close enough) |

| Component | IPC Pattern | Command |
|-----------|-------------|---------|
| DMS | `dms ipc call X` | Compositor-agnostic |
| Kitty | `kitty @ X` | Shell-agnostic |
| Niri | `niri msg X` | Direct compositor control |

The pattern: each component exposes its own IPC. Keybindings call IPC. Components are decoupled.

## Other Shell Components

### Notifications (SwayNC)

```kdl
Mod+N { spawn-sh "swaync-client -t -sw"; }
```

Toggle notification center. SwayNC follows similar IPC patterns.

### Lock Screen (Swaylock)

```kdl
Super+Alt+L { spawn "swaylock"; }
```

Simple spawn. Swaylock handles everything internally.

### Screenshots

Niri has built-in screenshot commands. For area selection, I use grim + slurp:

```kdl
Print { screenshot; }
Shift+Print { spawn-sh "grim -g \"$(slurp)\" ~/Pictures/Screenshots/$(date +%Y%m%d_%H%M%S).png"; }
```

## Design Decisions

| Decision | Tradeoff | Why |
|----------|----------|-----|
| Rofi over DMS spotlight | Extra config | More flexible, faster |
| Niri focus color in Rofi | Manual sync | Visual consistency worth the effort |
| IPC for shell features | Extra call overhead | Decouples compositor from shell |
| Fullscreen launcher | Dramatic but covering | Matches macOS feel I like |

## Dependencies

The full stack requires:

```bash
# Shell
quickshell dankmaterialshell

# Launcher
rofi

# Notifications
swaync

# Lock
swaylock

# Screenshots
grim slurp wl-clipboard

# Fonts
ttf-hack-nerd
```

## Testing Changes

Preview Rofi theme changes:

```bash
rofi -show drun -show-icons -theme ~/.config/rofi/themes/launchpad.rasi
```

Restart DMS after settings changes:

```bash
dms restart
```

Niri hot-reloads automatically.

---

*This is part 3 of the **Wayland Desktop Mastery** series. Next: [My 2026 Linux Desktop: Niri + DankMaterialShell + Kitty](/blog/2026-01-18-wayland-desktop-finale)*
