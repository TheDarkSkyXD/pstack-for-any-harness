# pstack for any harness

A portable adaptation of [pstack](https://github.com/cursor/plugins/tree/main/pstack), Poteto's engineering workflow for rigorous, verifiable agent work.

The bundle includes 65 reviewed skills. The [workflow coverage record](./docs/skill-coverage.md) lists additions, updates, and local safeguards retained during the refresh.

The upstream package is built around Cursor plugin routes. This project keeps the workflows and uses the cross-harness `.agents` layout:

```text
.agents/
├── agents/                 named subagent definitions
│   ├── comment-sicko.md
│   ├── poteto-agent.md
│   ├── thermo-nuclear-review-subagent.md
│   └── thermo-nuclear-code-quality-review-subagent.md
├── skills/                 65 Agent Skills
│   ├── poteto-mode/
│   ├── how/
│   ├── why/
│   └── ...
└── pstack-models.md        optional model map created by setup-pstack
```

## Install

Clone this repository, then run the installer with Node.js 18 or later:

```sh
git clone https://github.com/TheDarkSkyXD/pstack-for-any-harness.git
cd pstack-for-any-harness
node scripts/install.mjs --target "/path/to/project" --harness generic
```

Use `--harness claude`, `codex`, `copilot`, `cursor`, `gemini`, `opencode`, or `pi` to select the project's instruction file. Use `all` for a project shared across tools. Other tools can use `generic` or `--instructions path/to/instructions.md`. Paths with spaces work in PowerShell and POSIX shells when quoted.

The installer copies the shared bundle, carries the license notices, and adds a routing block to the selected instruction file. It preserves other instructions, custom skills, and model settings. Updates replace only unmodified previously installed files. A collision stops the install before writes. Preview with `--dry-run`.

You can also copy `.agents` manually, excluding `node_modules`. Place `LICENSE`, `LICENSE-cursor-team-kit`, `LICENSE-thermos`, and `NOTICE.md` in `.agents/pstack-notices/` without replacing the destination project's own license. Add the entry point to your harness's project instructions or load it explicitly.

Skill discovery paths vary by harness. This installer uses project instructions to point at `.agents/skills/poteto-mode/SKILL.md`, the main entry point. Native slash-command registration and plugin hooks are not installed. A harness must be able to read project files to use the bundle.

Named pstack subagents live under `.agents/agents`. Skills reference those files explicitly instead of relying on Cursor's plugin agent registry.

## Get started

1. Start with the current session's model. Optionally invoke `setup-pstack` to select confirmed available models and supported reasoning options per role. It writes `.agents/pstack-models.md`.
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
- With no model override, every role inherits the current session model. No Grok, Claude, or GPT subscription is required specifically by pstack.
- Missing delegation falls back to sequential work. Independent review gates remain unmet when no independent reviewer can run.
- Missing scheduling or browser tools are reported explicitly. Installing the skills does not add those tools.

Read the [shared harness contract](./.agents/skills/poteto-mode/references/harness.md) for fallback rules, the [installation guide](./docs/installation.md) for instruction paths, and the [portability notes](./docs/portability.md) for supported behavior and verification limits.

## Check portability

```sh
npm run check
npm test
```

The checks reject fixed provider model defaults and broken runtime links. The tests exercise installation profiles, repeat installs, conflicts, and preservation of project files. CI runs them on Windows, Linux, and macOS. These checks verify the bundle and installer; live model and tool availability still depends on your harness.

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
| [`benchmark-checklist`](./.agents/skills/benchmark-checklist/SKILL.md) | Vet benchmark results before reporting or acting on a measured speedup or regression. |
| [`create-verification-skill`](./.agents/skills/create-verification-skill/SKILL.md) | Generate a project-local skill that proves real behavior. |
| [`no-comments`](./.agents/skills/no-comments/SKILL.md) | Route comment review to [Comment Sicko](./.agents/agents/comment-sicko.md). |
| [`unslop`](./.agents/skills/unslop/SKILL.md) | Tighten agent-written prose. |
| [`show-me-your-work`](./.agents/skills/show-me-your-work/SKILL.md) | Keep an auditable decision trail for long runs. |
| [`correct`](./.agents/skills/correct/SKILL.md) | Find repeated agent mistakes in history, fix each at the highest level that works, and pair each rule with what enforces it. Try architecture, then types, lint and CI, tests, and docs last. |

The bundle also includes Poteto's playbooks and 24 principle skills. [`explain-the-number`](./.agents/skills/principle-explain-the-number/SKILL.md) requires evidence for what limits a measured result and checks whether the run measured the intended work. New workflows cover [formal verification](./.agents/skills/create-formal-verification-skill/SKILL.md), [formal-check maintenance](./.agents/skills/maintain-formal-verification-skill/SKILL.md), [PR maintenance](./.agents/skills/babysit/SKILL.md), [combined review](./.agents/skills/thermos/SKILL.md), and [workflow help](./.agents/skills/poteto-help/SKILL.md).

To turn repeated corrections into enforced repository rules, invoke:

```text
/correct
```

## Documentation

Start with [the pstack guide](./docs/guide/README.md). It covers setup, routing, investigation, design, implementation, verification, long-running work, principles, customization, and common pitfalls.

## License and attribution

The workflows are adapted from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan. [NOTICE](./NOTICE.md) records source attribution, and [LICENSE](./LICENSE) preserves the MIT notices alongside this project's copyright.
