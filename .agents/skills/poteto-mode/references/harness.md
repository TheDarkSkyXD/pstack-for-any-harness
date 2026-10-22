# Run pstack on the active harness

Apply these rules before a workflow's model, tool, delegation, or operating-system instructions. System instructions and the user's scope take precedence. A workflow cannot grant permission to send messages, publish, or perform other actions outside that scope.

Use the host's task tracker when available. Otherwise maintain `.audit/<task-slug>.todo.md`, with the playbook steps and explicit skip reasons. Different tasks use different files. Resolve `<agent-store>` to the host's durable project store, or to `pstack/` under the Git common directory. Record its absolute path in the trail; a session scratch directory is not durable storage.

## Resolve files

The project root contains `.agents/skills`, `.agents/agents`, and the optional `.agents/pstack-models.md`. Resolve project paths from that root and skill-relative paths from the skill's directory. Named agent Markdown files are instructions, not registrations in a native agent registry. If the harness cannot load a named agent, give its instructions to a general-purpose worker.

Read sibling skills from this bundle unless the user selected another installation. A harness without skill discovery can read the Markdown files directly. Slash commands are optional UI shortcuts, not executable shell commands.

## Choose a model

- With no model map or role entry, use `inherit-parent`. `auto` means the same thing. Omit the model override when the delegation interface supports inheritance. If it requires an ID, use the confirmed current-session ID.
- Panels default to three separate `inherit-parent` entries. Keep the requested number of candidates or review lenses even if only one model is available. Repeated models do not provide model diversity. Report that limitation.
- Validate explicit model IDs against the active delegation service's live catalog. A composer's model and a native subagent's accepted model may differ. Use a supported app-owned delegation service when it exposes a requested provider that native delegation cannot reach.
- Model IDs are opaque. Do not append effort suffixes, guess versions, choose by provider prefix, or probe invented IDs until one works. If a saved ID is unavailable, report it and inherit the current model. If the user explicitly requires that model or provider diversity, report the unmet requirement instead of claiming the fallback satisfies it.
- Preserve provider identity and supported model options. A role may use `model-id @high` to request reasoning effort, or an alias with that suffix. Pass the effort through the chosen tool's documented option field. A `default effort: session` line keeps session settings. Other default efforts apply to entries without a suffix. Validate efforts against that model's descriptors. Do not translate an unsupported effort to another level silently. Use the app-owned delegation service when native tools cannot carry the requested options.

## Adapt execution to available capabilities

Inspect the tools actually exposed by the harness. Never invent a tool name or assume that installing Markdown adds tools, authentication, models, or permissions.

- **No delegation:** do the work in the current session, sequentially. Keep candidate artifacts separate and apply each review lens in its own pass. State that the passes share one context. A self-review cannot satisfy a required independent review gate. Leave that gate unmet and return the evidence needed for another reviewer.
- **Delegation saturated:** retain completed independent findings and record `BLOCKED: independent review` with the missing reviewers. Continue work that does not depend on the gate. Reuse a reviewer only through a supported host lifecycle, with the full current brief and revision, when that reviewer did not author the change; count it once. Hosts that require a fresh delegated task for each round must receive a new task. Never count self-review or green CI as an independent verdict.
- **Delegation without parallel execution:** run workers in sequence. Keep their original scopes and output paths. Do not weaken the verification criteria.
- **No writable isolation:** use separate task directories under the OS temporary directory. Do not let candidates edit the same checkout concurrently. A worktree starts from committed files unless the service says otherwise; supply uncommitted context explicitly.
- **No structured questions:** ask in ordinary text only when needed. Continue work that does not depend on the answer.
- **No transcript access:** use the visible conversation and workspace artifacts, label the gaps, and do not search unrelated sessions.
- **No connectors or browser:** use available local evidence or a documented CLI. Label unavailable sources and unverified UI behavior.
- **No persistent scheduler:** finish a bounded run and write a checkpoint. Do not promise a later wake-up or claim a shell sleep survives the session.
- **No native PR watcher:** use bounded status checks during the current session or give a checkpoint. If a native watcher exists, use its lifecycle instead of starting another polling loop.

Before replacing a writer or transferring its checkout, stop that task and its descendants through the host lifecycle and confirm their writes have stopped. A returned turn or completed notification alone does not establish that background children exited. Do not mutate or test a checkout still owned by another writer.

For PR work, resolve one supported forge route and preserve it for the task. Prefer host-owned PR operations where they track the thread or review lifecycle, then use the resolved CLI for uncovered operations. Discover capabilities instead of requiring a particular vendor CLI. Register created or updated PRs through host tracking when available. Landing requires the user's authorization and the Shipping gates; a workflow does not create that authorization.

## Match the host platform

Use the active shell and OS temporary-directory API. `/tmp`, `~`, Bash syntax, `chmod`, and symlinks are not universal. Translate simple commands to the host shell. Run bundled `.sh` helpers only with Bash available, and Bun helpers only with Bun and their declared dependencies available. The core Markdown workflows require neither. Missing optional helpers are a reported limitation, not evidence that a check passed.

Use explicit launchers on hosts that do not execute shebang files directly. From the project root, the PR helpers run as `bun .agents/skills/poteto-mode/scripts/watch-pr/watch-pr ...` and `bun .agents/skills/poteto-mode/scripts/watch-pr/ship-pr ...`. Bookkeeping runs as `bun .agents/skills/poteto-mode/scripts/orch/orch.ts ...`. Node helpers run with `node` and their full project-relative paths.

Return actual results with skipped capabilities and unmet gates. Never report parallelism, independent review, provider diversity, durable scheduling, or live verification that did not happen.
