---
name: thermos
description: "Launch both thermo-nuclear review subagents in parallel, then synthesize their findings. Use for thermos, double thermo review, or combined bug/security and code-quality branch audits."
---

# Thermos

## Runtime

Read [the harness contract](../poteto-mode/references/harness.md) before following this workflow. It defines model inheritance, tool fallbacks, and unmet verification gates.

Run the two thermo review passes as async background subagents in parallel, then synthesize their results.

## Workflow

1. Determine the review scope from the user request, PR, current branch, or relevant changed files.
2. Gather the diff and any file/context excerpts needed for reviewers to evaluate the change without guessing.
3. Launch both subagents in the same message with background execution when supported:
   - Load `.agents/agents/thermo-nuclear-review-subagent.md` as the worker instructions for bugs, breakages, security, developer-experience regressions, feature-flag leaks, and other branch-audit risks.
   - Load `.agents/agents/thermo-nuclear-code-quality-review-subagent.md` as the worker instructions for maintainability, structure, file-size growth, abstractions, and codebase-health risks.
4. Pass each subagent the same scoped diff/file context and ask it to return prioritized findings with file references and evidence.
5. After both finish, synthesize the results with findings first, deduplicated across reviewers. Weight overlapping findings more heavily, resolve disagreements with your own judgment, and keep summaries brief.

If individual background summaries are already visible to the user, do not restate them wholesale. Surface the unified verdict, the highest-signal findings, and any remaining uncertainty.
