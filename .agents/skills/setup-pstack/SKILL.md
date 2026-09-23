---
name: setup-pstack
description: Configure which models pstack uses per role and at what reasoning budget. Detect available models and write the cross-harness `.agents/pstack-models.md` override file. Use for /setup-pstack, "configure pstack models", "pstack budget", or changing pstack's model choices.
---

# Setup pstack

Write `.agents/pstack-models.md`, the shared model map that pstack skills read directly.

## Steps

### 1. Detect available models

Enumerate the model identifiers accepted by the active harness's delegation interface. Prefer a harness-provided models API or CLI when available. If you cannot detect any, ask the user for the identifiers they can use. Never write an identifier you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid even when they are not listed.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in step 5 below. If `.agents/pstack-models.md` already exists, read it and treat its `# budget` line and role values as the current choices. Otherwise start from those defaults.

### 3. Budget, map, and confirm

**Ask for a budget.** Prefer the harness's structured user-input tool when available. Offer these four choices and name the current budget when the model map records one:

- `unlimited`: keep default efforts, up to max.
- `large`: xhigh reasoning.
- `medium`: high reasoning.
- `small`: medium reasoning.

**Apply it.** Build the working table from the skill defaults on every run, preserving roles customized by model family, list membership or order, or alias (`inherit-parent`, `auto`). Do not carry over effort reductions from the previous budget when rebuilding default entries. `unlimited` leaves the rebuilt table's efforts unchanged. `large`, `medium`, and `small` set the effort token of every real identifier, including panel entries, to `xhigh`, `high`, or `medium`. The effort token is the last token, or the one before a trailing `fast`, on the ladder `max` > `xhigh` > `high` > `medium` > `low`.

If the result is not detected, use the same model family's detected identifier with the highest effort at or below the target. Otherwise mark the role as needing a choice. For example, `small` maps `claude-opus-5-5-max` to `claude-opus-5-5-medium`, and `grok-4.7-xhigh-fast` to `grok-4.7-medium-fast`, only if those identifiers are available. Do not invent effort suffixes for harnesses that expose reasoning separately or do not expose it; mark those roles for an explicit supported choice. Leave `inherit-parent` and `auto` unchanged.

**Show the roles and confirm.**

Show every role with its current model, marking any real identifier not in the detected set as needing a choice. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto`; both mean to use the parent chat model. Prefer the harness's structured user-input tool when available. For panel roles (arena runners, architect runners, interrogate reviewers), one subagent runs per list entry, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects a model family different from the parent's when possible. `swarm workers` is the default for every worker unless a race assigns another model per arm.

### 4. Validate

Every real slug written must be in the detected set. `inherit-parent` and `auto` always pass. If a chosen real slug is not available, stop and ask again.

### 5. Write the rule

Write `.agents/pstack-models.md` with a `# budget` line recording the chosen label and target effort, and one line per role, using the same labels poteto-mode uses. Overwrite the whole file so re-runs stay idempotent. The budget line records the requested preset; confirmed role values record any availability fallback or explicit override. Shape:

```
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` uses the parent chat model. Alias entries in a panel list still count toward its fan-out.
# budget: unlimited (max)
feature, refactoring: grok-4.7-xhigh-fast
bug-fix: grok-4.7-xhigh-fast
perf-issue: grok-4.7-xhigh-fast
hillclimb: grok-4.7-xhigh-fast
judgment and prose: claude-opus-5-5-max
hardest tasks: claude-opus-5-5-max
how explorer: grok-4.7-xhigh-fast
how explainer: claude-opus-5-5-max
why investigators: grok-4.7-xhigh-fast
why synthesizer: claude-opus-5-5-max
reflect tooling: gpt-5.6-sol-max
reflect judgment, divergent, synthesizer: claude-opus-5-5-max
arena runners: claude-opus-5-5-max, gpt-5.6-sol-max, grok-4.7-xhigh-fast
arena cross-judge pool: claude-opus-5-5-max, gpt-5.6-sol-max, grok-4.7-xhigh-fast
swarm workers: grok-4.7-xhigh-fast
architect runners: claude-opus-5-5-max, gpt-5.6-sol-max, grok-4.7-xhigh-fast
interrogate reviewers: claude-opus-5-5-max, gpt-5.6-sol-max, grok-4.7-xhigh-fast
```

### 6. Confirm

Tell the user the model map was written. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill under `.agents/skills`, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, read and follow `.agents/skills/create-verification-skill/SKILL.md`. On no, move on without pushing.
