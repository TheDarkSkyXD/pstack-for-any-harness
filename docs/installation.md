# Install pstack in a project

Use Node.js 18 or later to run the installer. The Markdown workflows themselves do not require Node, Bash, or Bun. Some optional bundled helpers have their own runtime dependencies.

From a clone of this repository, run:

```sh
node scripts/install.mjs --target "/path/to/project" --harness all --dry-run
node scripts/install.mjs --target "/path/to/project" --harness all
```

Replace the target with your project directory. Quote Windows paths in PowerShell, for example `--target 'F:\My Projects\my-app'`. The installer copies files rather than creating symlinks, so it needs no symlink permissions or POSIX shell.

## Select an instruction file

Each profile installs the same `.agents` bundle. The profile selects where to add the routing instruction. These are instruction-based installs, not native plugin packages. Native skill discovery and slash menus vary by product and version.

| `--harness` | Project instruction file |
|---|---|
| `generic`, `codex`, `cursor`, `opencode`, `pi` | `AGENTS.md` |
| `claude` | `CLAUDE.md` |
| `gemini` | `GEMINI.md` |
| `copilot` | `.github/copilot-instructions.md` |
| `all` | All four files above |

The defaults follow the project-instruction conventions documented by [Claude Code](https://code.claude.com/docs/en/memory), [Cursor](https://cursor.com/docs/context/rules), [OpenCode](https://docs.opencode.ai/docs/rules/), [Pi](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/configuration.md#context-files), [Gemini CLI](https://geminicli.com/docs/cli/gemini-md/), and [GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot).

For another tool, select its documented project instruction file explicitly:

```sh
node scripts/install.mjs --target "/path/to/project" --instructions docs/agent-instructions.md
```

The custom path must be a Markdown file inside the target project and outside `.agents`. Configure your tool to read that file if it does not do so automatically. For a tool without project instructions, load `.agents/skills/poteto-mode/SKILL.md` explicitly in each new session. A text-only chat without filesystem access needs you to provide the skill text and relevant references.

## Update an installation

Update this clone, then rerun the same install command. The installer keeps hashes in `.agents/pstack-install.json`. It replaces a file only when its current bytes match the previous installation, or already match the new version. It reports conflicting paths before writing anything so you can merge local edits.

Keep that manifest for future updates. It retains hashes for retired files so a later release can restore an unchanged file without a false conflict. Keep `.agents/pstack-models.md` for your project's model choices. The installer never copies a source checkout's model choices into another project and never removes custom skills or obsolete files automatically. It changes only the marked pstack block in instruction files.

When creating `CLAUDE.md` beside an existing `AGENTS.md`, the installer adds `@AGENTS.md` so Claude continues loading your shared project rules. Existing `CLAUDE.md` content is preserved.

## Configure models only when needed

With no configuration, every workflow uses `inherit-parent`. To choose different confirmed models or reasoning effort, ask for `setup-pstack`. There is no required provider or fixed model version.

Panel lists still control worker count. Three inherited entries create three workers on one model when delegation is available. Without delegation, the workflow runs in the current session and reports missing independence. Provider diversity, durable scheduling, and browser access require capabilities supplied by the host.

## Remove pstack

Remove the block between `<!-- pstack:start -->` and `<!-- pstack:end -->` from each instruction file you installed. Inspect `.agents/pstack-install.json` and remove only the listed pstack files you no longer want. Keep unrelated skills, project model choices, and other project instructions.
