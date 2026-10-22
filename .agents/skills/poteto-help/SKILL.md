---
name: poteto-help
description: Explain pstack setup, model choices, and which skill or playbook fits a task. Use for /poteto-help or questions about using pstack.
---

# Poteto help

## Runtime

Read [the harness contract](../poteto-mode/references/harness.md) before following this workflow. It defines model inheritance, tool fallbacks, and unmet verification gates.

For a help question, read the matching installed source, answer the question, and give a prompt the user can send. Do not start implementation unless the user requested action. If they asked for work, read [poteto-mode](../poteto-mode/SKILL.md) and proceed.

Use local file links to the installed material you actually read. Do not invent public URLs or assume a native plugin, slash-command registry, startup hook, or provider-specific installation.

## Setup and cost

Read [setup-pstack](../setup-pstack/SKILL.md) before explaining role models or reasoning effort. The map is optional and lives at `.agents/pstack-models.md`. Without it, roles inherit the current session model and effort. Supported model IDs and options come from the active delegation service.

Project instruction files point at the router. Ask the user to invoke `poteto-mode` by name when their harness does not load project instructions. Installing Markdown does not add tools.

Subagents and review panels consume extra tokens. Fewer panel entries, supported lower effort, and a cheaper model can reduce cost. Do not silently change an explicit user setting. For installation questions, read the repository's installation guide when available; do not claim the installed skills include an installer or hook they do not contain.

## Pick the workflow

- A bug, feature, refactor, or investigation starts with [poteto-mode](../poteto-mode/SKILL.md), which selects a playbook.
- Code behavior belongs to [how](../how/SKILL.md); rationale and attributable human decisions belong to [why](../why/SKILL.md).
- Design alternatives belong to [architect](../architect/SKILL.md) and [arena](../arena/SKILL.md).
- Parallel coverage belongs to [swarm](../swarm/SKILL.md). Adversarial review belongs to [interrogate](../interrogate/SKILL.md). Combined bug and maintainability review belongs to [thermos](../thermos/SKILL.md).
- Live proof belongs to [create-verification-skill](../create-verification-skill/SKILL.md). Races, bounds, and invariants beyond examples belong to [create-formal-verification-skill](../create-formal-verification-skill/SKILL.md). Maintain those checks with [maintain-formal-verification-skill](../maintain-formal-verification-skill/SKILL.md).
- PR maintenance belongs to [babysit](../babysit/SKILL.md); merge authority and stack safety belong to the [Shipping playbook](../poteto-mode/playbooks/shipping.md).
- A long program belongs to [figure-it-out](../figure-it-out/SKILL.md) or the [Orchestrate playbook](../poteto-mode/playbooks/orchestrate.md). A mid-run status explanation belongs to [ketchup](../ketchup/SKILL.md).
- Personal conventions belong to [automate-me](../automate-me/SKILL.md), recent context to [recall](../recall/SKILL.md), and recurring mistakes to [correct](../correct/SKILL.md).
- Use [in-your-own-words](../in-your-own-words/SKILL.md) to check shared understanding, [sharpen](../sharpen/SKILL.md) to tighten a request, and [make-pr-easy-to-review](../make-pr-easy-to-review/SKILL.md) to improve a reviewer brief.

A useful task prompt names the outcome and observable proof. Read the selected workflow before giving a concrete example. Report unavailable tools and unmet review gates instead of promising capabilities the host lacks.
