# Set up pstack

In this page you add the shared agent bundle to a project, pick which models pstack uses, and run your first task.

## Add pstack to a project

Run `node scripts/install.mjs --target "/path/to/project" --harness all` from a clone of this repository. The [installation guide](../installation.md) covers individual profiles and custom instruction paths. Keep the bundle's two canonical roots intact:

- `.agents/skills/` contains discoverable skills.
- `.agents/agents/` contains named subagent definitions referenced by those skills.

Your harness may discover Agent Skills automatically. If it does not, point it directly at the relevant `SKILL.md`, starting with `.agents/skills/poteto-mode/SKILL.md`.

## Pick your models

Run:

```text
/setup-pstack
```

Setup is optional. Without a model map, every role inherits the current session's model. [`/setup-pstack`](../../.agents/skills/setup-pstack/SKILL.md) detects the models and reasoning options the active delegation service exposes, shows you each role, and writes confirmed choices to `.agents/pstack-models.md`. It does not guess model IDs or append effort suffixes to them.

You only override what you care about. A role with no line in the rule keeps the skill's default. To restore a default later, delete that role's line, or just run `/setup-pstack` again.

`/setup-pstack` preserves explicit role choices on reruns, including choices made before the defaults changed. Delete a role's line (or the whole model map) to adopt the current defaults for it.

Set a role to `inherit-parent` or `auto` when it should use the parent chat model. Both values mean the same thing, and neither is a model identifier. For a panel role the value is a list, and one subagent runs per entry, so the list length sets the panel size. Setup also configures `swarm workers`, the default model for every `/swarm` worker unless a race names a model for each arm.

## Accept the verification offer, or don't

At the end of setup, `/setup-pstack` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/create-verification-skill`](../../.agents/skills/create-verification-skill/SKILL.md).

Say yes and it writes `.agents/skills/verify-<app>/`, a project-local skill that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers when it earns its place.

After setup, pstack skills read the model map whenever they delegate work.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/poteto-mode` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

From here you can type normal follow-ups. `/poteto-mode` is sticky. It stays on for the conversation until you opt out by saying so.

Next: [Route work through `/poteto-mode`](./02-poteto-mode.md).
