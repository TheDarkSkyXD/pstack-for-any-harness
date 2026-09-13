# pstack for any harness

A portable adaptation of [pstack](https://github.com/cursor/plugins/tree/main/pstack), Poteto's engineering workflow for rigorous, verifiable agent work.

The upstream package is built around Cursor plugin routes. This fork keeps the workflows and moves the runtime bundle to the cross-harness `.agents` layout:

```text
.agents/
├── agents/                 named subagent definitions
│   ├── comment-sicko.md
│   └── poteto-agent.md
├── skills/                 46 Agent Skills
│   ├── poteto-mode/
│   ├── how/
│   ├── why/
│   └── ...
└── pstack-models.md        optional model map created by setup-pstack
```

## Install

Copy this repository's `.agents` directory into the root of the project where you want to use pstack.

Harnesses that implement Agent Skills can discover `.agents/skills/*/SKILL.md` directly. If a harness does not auto-discover them, point it at `.agents/skills/poteto-mode/SKILL.md`. That is the main entry point and routes to the other skills as needed.

Named pstack subagents live under `.agents/agents`. Skills reference those files explicitly instead of relying on Cursor's plugin agent registry.

## Get started

1. Invoke `setup-pstack` or ask the agent to configure pstack's model roles. It detects models exposed by the active harness, asks you to pick a reasoning budget and confirm the models, and writes `.agents/pstack-models.md`.
2. Invoke `poteto-mode` for a non-trivial task. Describe the outcome and how to prove it.

For example:

```text
/poteto-mode the export writes duplicate rows when a retry lands mid-run. reproduce it first, then fix and verify it.
```

Slash-command syntax varies by harness. Natural-language requests work when the harness triggers skills from their descriptions.

## Cross-harness routing

- Skills resolve project-local skills through `.agents/skills/<name>/SKILL.md`.
- Custom subagents resolve through `.agents/agents/<name>.md`.
- Model overrides resolve through `.agents/pstack-models.md`.
- Delegation, structured questions, transcript access, scheduling, browser control, and remote workers use the active harness's available capability instead of a Cursor-specific tool name.
- Missing optional capabilities degrade to an explicit limitation; they do not redirect into `.cursor` paths.

## Included workflows

`poteto-mode` is the router. It selects a playbook and brings in focused skills when the task needs them.

| Skill | Purpose |
|---|---|
| [`poteto-mode`](./.agents/skills/poteto-mode/SKILL.md) | Main entry point for rigorous engineering work. |
| [`how`](./.agents/skills/how/SKILL.md) | Explain how a subsystem works. |
| [`why`](./.agents/skills/why/SKILL.md) | Investigate design history and rationale. |
| [`architect`](./.agents/skills/architect/SKILL.md) | Settle caller usage, types, and module shape before implementation. |
| [`arena`](./.agents/skills/arena/SKILL.md) | Compare multiple attempts at the same problem. |
| [`swarm`](./.agents/skills/swarm/SKILL.md) | Fan work across independent slices and aggregate the result. |
| [`interrogate`](./.agents/skills/interrogate/SKILL.md) | Run adversarial multi-model review. |
| [`tdd`](./.agents/skills/tdd/SKILL.md) | Reproduce with a failing test before fixing. |
| [`create-verification-skill`](./.agents/skills/create-verification-skill/SKILL.md) | Generate a project-local skill that proves real behavior. |
| [`no-comments`](./.agents/skills/no-comments/SKILL.md) | Route comment review to [Comment Sicko](./.agents/agents/comment-sicko.md). |
| [`unslop`](./.agents/skills/unslop/SKILL.md) | Tighten agent-written prose. |
| [`show-me-your-work`](./.agents/skills/show-me-your-work/SKILL.md) | Keep an auditable decision trail for long runs. |

The bundle also includes Poteto's playbooks and 21 principle skills.

## Documentation

Start with [the pstack guide](./docs/guide/README.md). It covers setup, routing, investigation, design, implementation, verification, long-running work, principles, customization, and common pitfalls.

## License and attribution

The workflows are adapted from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan. The root [LICENSE](./LICENSE) preserves the upstream MIT notice alongside this fork's copyright.
