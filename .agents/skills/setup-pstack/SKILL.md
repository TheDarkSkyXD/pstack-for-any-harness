---
name: setup-pstack
description: Configure which models pstack uses per role and at what reasoning budget. Detect available models and write the cross-harness `.agents/pstack-models.md` override file. Use for /setup-pstack, "configure pstack models", "pstack budget", or changing pstack's model choices.
---

# Setup pstack

## Runtime

Read [the harness contract](../poteto-mode/references/harness.md) before following this workflow. It defines model inheritance, tool fallbacks, and unmet verification gates.

Write `.agents/pstack-models.md`, the shared model map that pstack skills read directly. Setup is optional. Without a model map, every role inherits the current session model.

## Detect capabilities and load current choices

Inspect the active delegation service's live model catalog, provider identities, and supported options. Do not assume that a model selectable in the composer is accepted by every worker tool. If there is no catalog, use `inherit-parent` without asking the user to supply model IDs. If there is no delegation tool, record that workflows run sequentially in the current session.

Read an existing `.agents/pstack-models.md` and preserve explicit choices that are available. Mark stale IDs and unsupported options instead of retrying guessed versions. Show retired or unknown role lines before removing them. Role labels may contain commas; split each role line at its first colon, then split only the value into panel entries.

## Choose models and reasoning effort

When the user has not already specified preferences, show current choices and offer to keep session defaults or select from the confirmed catalog. Use the harness's structured question tool when available, otherwise ordinary text. Do not block a task on optional setup.

The budget presets request these efforts: `unlimited` requests `max`, `large` requests `xhigh`, `medium` requests `high`, and `small` requests `medium`. Offer only levels the selected model supports. If a requested level is unavailable, explain the mismatch and keep that choice pending. Do not silently downgrade it. The default is `session`, which preserves the current session settings.

Model IDs are opaque. Never encode a budget by adding or replacing an ID suffix. Store effort separately as `@<effort>` on a role value, or use `default effort` for entries without a suffix. Pass it in the delegation service's documented options field. `inherit-parent @high` inherits the model and requests high effort only when the service can apply it.

Each panel entry creates one worker. Three `inherit-parent` entries mean three workers on the same model, not three providers. `arena cross-judge pool` supplies choices for one judge. `swarm workers` supplies the worker default unless a race explicitly assigns models.

## Validate and write

Every explicit ID must be confirmed for the chosen provider and delegation service. Validate requested effort against that model's option descriptors. If a configured model is unavailable, explain the fallback to `inherit-parent`. If the user requires the unavailable model, leave the requirement unmet and do not claim setup fulfilled it.

Write the following role shape with the confirmed choices. Keep a budget comment when a preset was selected. Use `default effort: session` unless the user requested a supported effort. Do not copy credentials, service tokens, or machine-specific paths into the map.

```text
# pstack model configuration
# auto and inherit-parent use the current session model.
# Each panel entry counts as a separate worker.
feature, refactoring: inherit-parent
bug-fix: inherit-parent
perf-issue: inherit-parent
hillclimb: inherit-parent
judgment and prose: inherit-parent
hardest tasks: inherit-parent
how explorer: inherit-parent
how explainer: inherit-parent
why investigators: inherit-parent
why synthesizer: inherit-parent
reflect tooling: inherit-parent
reflect judgment, divergent, synthesizer: inherit-parent
arena runners: inherit-parent, inherit-parent, inherit-parent
arena cross-judge pool: inherit-parent
swarm workers: inherit-parent
architect runners: inherit-parent, inherit-parent, inherit-parent
interrogate reviewers: inherit-parent, inherit-parent, inherit-parent
default effort: session
```

Re-running setup preserves supported explicit model choices, panel order, and requested options. Write the whole agreed map so reruns do not duplicate lines. Deleting a role restores `inherit-parent`, or three inherited workers for a panel.

Report the map path, any unavailable capabilities, and whether review panels have model diversity. If the project lacks a way to prove real behavior, offer the [create-verification-skill](../create-verification-skill/SKILL.md) workflow once.

If concurrency, retries, parsers, unsafe code, or important invariants warrant checking beyond examples, offer [create-formal-verification-skill](../create-formal-verification-skill/SKILL.md) once unless the project already has such a skill. This is optional and does not block setup.
