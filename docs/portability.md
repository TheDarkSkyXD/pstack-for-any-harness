# Harness portability

Pstack for any harness stores its workflows in one `.agents` bundle. The installer adds project instructions that point the active tool at the router. Operational workflows read the shared [harness contract](../.agents/skills/poteto-mode/references/harness.md) before choosing models or tools.

Unconfigured model roles inherit the current session's model. Explicit model choices and reasoning options must be supported by the active delegation service. Pstack does not require a specific model provider.

When delegation is unavailable, workflows run sequentially in the current session. Independent-review gates remain unmet without an independent reviewer. Missing browser access, connectors, or persistent scheduling are reported as limitations.

The [installer](installation.md) supports project instruction files for several tools and accepts a custom instruction path for others. It does not register native slash commands, install subagent services, or create background schedulers.

Automated checks cover fixed model defaults, workflow runtime links, installation profiles, conflicts, and repeat installs. CI is configured for Windows, Linux, and macOS. Live operation in every external harness remains separate verification; project instruction support cannot guarantee that a host supplies delegation, model choice, or persistent scheduling.

The [skill coverage record](skill-coverage.md) tracks the full bundle and supporting file hashes. The refresh also supplies project-discoverable checkpoints, guarded shipping helpers, project-playbook validation, formal-verification workflows, and additional review agents. Optional Bun helpers have their own behavior tests and TypeScript checks; installing the Markdown does not install external verification engines or authenticate a forge CLI.
