---
name: babysit
description: Watch an open PR, fix failing CI and actionable review feedback, and bring it to a mergeable state. Use when the user asks to babysit, monitor, or get a PR green.
---

# Babysit

## Runtime

Read [the harness contract](../poteto-mode/references/harness.md) before following this workflow. It defines model inheritance, tool fallbacks, and unmet verification gates.

Follow the [Babysit playbook](../poteto-mode/playbooks/babysit.md). It owns the status, background, threads-only, and drive modes, target validation, frontier, and stop conditions.

Resolve one supported forge route. Prefer host-owned PR lifecycle tools when available. Use a native watcher for durable monitoring when the host provides one. Do not create a second polling loop alongside it or claim a bounded session check will resume later.

Use [fix-ci](../fix-ci/SKILL.md) for failing checks, [get-pr-comments](../get-pr-comments/SKILL.md) for review evidence, and [fix-merge-conflicts](../fix-merge-conflicts/SKILL.md) only when the authorized topology owner delegates that repair. Hand a behind-base or conflicting frontier to that owner.

Keep independent review gates closed when reviewers cannot run. Monitoring does not grant merge authority. An explicit landing request routes to the [Shipping playbook](../poteto-mode/playbooks/shipping.md).

Report the PR or frontier, evidence of current checks and blockers, fixes applied, remaining review gates, and the reason monitoring stopped or continues.
