---
name: setup-pstack
description: Configure which models pstack uses per role. Detect available models and write the cross-harness `.agents/pstack-models.md` override file. Use for /setup-pstack, "configure pstack models", or changing pstack's model choices.
---

# Setup pstack

Write `.agents/pstack-models.md`, the shared model map that pstack skills read directly. A missing file or role falls back to the active harness's available models, so this is an override layer, not a requirement.

## Steps

### 1. Detect available models

Enumerate the model identifiers accepted by the active harness's delegation interface. Prefer a harness-provided models API or CLI when available. If you cannot detect any, ask the user for the identifiers they can use. Never write an identifier you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even when they are not listed.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in step 5 below. If `.agents/pstack-models.md` already exists, read it and treat its values as the current choices. Otherwise start from those defaults.

### 3. Map and confirm

Show every role with its current model, marking any real identifier not in the detected set as needing a choice. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto`; both mean to use the parent chat model. Prefer the harness's structured user-input tool when available. For panel roles (how critics, arena runners, architect runners, interrogate reviewers), one subagent runs per list entry, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects a model family different from the parent's when possible. `swarm workers` is the default for every worker unless a race assigns another model per arm.

### 4. Validate

Every real slug written must be in the detected set; `inherit-parent` and `auto` always pass. If a chosen real slug is not available, stop and ask again. A rule pointing at a model the user cannot use breaks every delegation that reads it.

### 5. Write the rule

Write `.agents/pstack-models.md` with one line per role, using the same labels poteto-mode uses. Overwrite the whole file so re-runs stay idempotent. Shape:

```
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` uses the parent chat model. Alias entries in a panel list still count toward its fan-out.
feature, refactoring: grok-4.6-fast-xhigh
bug-fix: gpt-5.6-sol-max
perf-issue: gpt-5.6-sol-max
hillclimb: gpt-5.6-sol-max
judgment and prose: claude-fable-5-thinking-max
hardest tasks: claude-fable-5-thinking-max
how explorer: grok-4.6-fast-xhigh
how explainer: claude-fable-5-thinking-max
how critics: claude-fable-5-thinking-max, gpt-5.6-sol-max, grok-4.6-fast-xhigh, claude-opus-5-thinking-xhigh
why investigators: grok-4.6-fast-xhigh
why synthesizer: claude-fable-5-thinking-max
reflect tooling: gpt-5.6-sol-max
reflect judgment, divergent, synthesizer: claude-fable-5-thinking-max
arena runners: claude-fable-5-thinking-max, gpt-5.6-sol-max, grok-4.6-fast-xhigh, claude-opus-5-thinking-xhigh
arena cross-judge pool: claude-fable-5-thinking-max, gpt-5.6-sol-max, grok-4.6-fast-xhigh, claude-opus-5-thinking-xhigh
swarm workers: grok-4.6-fast-xhigh
architect runners: claude-fable-5-thinking-max, gpt-5.6-sol-max, grok-4.6-fast-xhigh, claude-opus-5-thinking-xhigh
interrogate reviewers: claude-fable-5-thinking-max, gpt-5.6-sol-max, grok-4.6-fast-xhigh, claude-opus-5-thinking-xhigh
```

### 6. Confirm

Tell the user the model map was written. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill under `.agents/skills`, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, read and follow `.agents/skills/create-verification-skill/SKILL.md`. On no, move on without pushing.
