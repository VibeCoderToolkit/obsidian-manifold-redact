# Manifold Redaction

Companion plugin for the [Manifold](https://github.com/VibeCoderToolkit/obsidian-manifold)
theme. It marks a selected passage as redacted, and the theme draws that as a bar
with the words knocked out.

The theme renders the bar on its own, so this plugin is only needed to place the
marker from the editor. Typing `<mark class="redacted">words</mark>` by hand
works the same.

## Install

Copy this folder into `<vault>/.obsidian/plugins/manifold-redact/`, then enable
"Manifold Redaction" in Settings, Community plugins. It is plain JavaScript with
no build step, and it can also be installed with the BRAT plugin.

## Use

- Select a passage, right-click, choose Redact selection.
- Or bind a hotkey to "Manifold Redaction: Toggle redaction on the selection".
- Run it again on the same passage to lift the bar.

In the editor the line you are working on lifts its overlay so the passage can be
edited, and the bar closes when the cursor moves away.

Visual marking only: the words stay in the file as plain text.
