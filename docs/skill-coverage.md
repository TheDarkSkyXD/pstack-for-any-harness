# Skill workflow coverage

The bundle contains 65 skills. During this refresh, 16 skills were added, 22 existing skills or their supporting files changed, and 27 were reviewed and retained.

Every existing skill and its authored supporting Markdown was compared with the current workflow snapshot. Local safeguards were retained where they were stronger or already matched the intended behavior. Runtime-specific model defaults, registries, transcript paths, and startup hooks were replaced by the shared [harness contract](../.agents/skills/poteto-mode/references/harness.md).

The machine-readable [inventory](../.agents/skill-coverage.json) records each skill and file hash. Regenerate the current hashes and this page with `node scripts/skill-inventory.mjs --write`; verify them with `node scripts/skill-inventory.mjs --check`. Refreshing from another bundle is staged separately with `node scripts/refresh-skills.mjs --source <bundle> --output <review-directory>`. Staging does not apply changes or prove that model, tool, and local-policy differences are resolved. Review those differences before replacing installed files.

## Changes reviewed

- Design deviations update the saved contracts and rationale before a unit closes. Consumer censuses run before design when a brief asserts facts about existing code.
- Verification includes startup from empty data, code-to-model correspondence, explicit formal bounds, deliberate failing controls, and sync-commit tracking.
- Independent review stays closed under delegation limits. Writers use exclusive checkouts, and their descendants stop before ownership transfers.
- PR workflows capture head, base, destination, pending merge mechanisms, and destination applicability. Landing authority follows the user's grant, and every patch-changing push keeps the required review cadence.
- Checkpoints are project-discoverable and validate linked evidence. Cleanup protects untracked and non-disposable ignored files.
- History preserves original human rulings, distinguishes interpretations, and treats copied summaries as one evidence chain. Model setup and transcript access remain host-independent.

## Skill inventory

| Skill | Refresh result |
|---|---|
| [architect](../.agents/skills/architect/SKILL.md) | Updated |
| [arena](../.agents/skills/arena/SKILL.md) | Reviewed and retained |
| [automate-me](../.agents/skills/automate-me/SKILL.md) | Updated |
| [babysit](../.agents/skills/babysit/SKILL.md) | Added |
| [benchmark-checklist](../.agents/skills/benchmark-checklist/SKILL.md) | Reviewed and retained |
| [blast-radius](../.agents/skills/blast-radius/SKILL.md) | Updated |
| [bro](../.agents/skills/bro/SKILL.md) | Reviewed and retained |
| [correct](../.agents/skills/correct/SKILL.md) | Updated |
| [create-formal-verification-skill](../.agents/skills/create-formal-verification-skill/SKILL.md) | Added |
| [create-verification-skill](../.agents/skills/create-verification-skill/SKILL.md) | Updated |
| [deslop](../.agents/skills/deslop/SKILL.md) | Added |
| [figure-it-out](../.agents/skills/figure-it-out/SKILL.md) | Reviewed and retained |
| [fix-ci](../.agents/skills/fix-ci/SKILL.md) | Added |
| [fix-merge-conflicts](../.agents/skills/fix-merge-conflicts/SKILL.md) | Added |
| [get-pr-comments](../.agents/skills/get-pr-comments/SKILL.md) | Added |
| [how](../.agents/skills/how/SKILL.md) | Updated |
| [in-your-own-words](../.agents/skills/in-your-own-words/SKILL.md) | Added |
| [interrogate](../.agents/skills/interrogate/SKILL.md) | Updated |
| [ketchup](../.agents/skills/ketchup/SKILL.md) | Added |
| [maintain-formal-verification-skill](../.agents/skills/maintain-formal-verification-skill/SKILL.md) | Added |
| [maintain-verification-skill](../.agents/skills/maintain-verification-skill/SKILL.md) | Reviewed and retained |
| [make-pr-easy-to-review](../.agents/skills/make-pr-easy-to-review/SKILL.md) | Added |
| [no-comments](../.agents/skills/no-comments/SKILL.md) | Reviewed and retained |
| [poteto-help](../.agents/skills/poteto-help/SKILL.md) | Added |
| [poteto-mode](../.agents/skills/poteto-mode/SKILL.md) | Updated |
| [principle-attack-the-premise](../.agents/skills/principle-attack-the-premise/SKILL.md) | Updated |
| [principle-boundary-discipline](../.agents/skills/principle-boundary-discipline/SKILL.md) | Reviewed and retained |
| [principle-build-the-lever](../.agents/skills/principle-build-the-lever/SKILL.md) | Updated |
| [principle-encode-lessons-in-structure](../.agents/skills/principle-encode-lessons-in-structure/SKILL.md) | Reviewed and retained |
| [principle-exhaust-the-design-space](../.agents/skills/principle-exhaust-the-design-space/SKILL.md) | Reviewed and retained |
| [principle-experience-first](../.agents/skills/principle-experience-first/SKILL.md) | Reviewed and retained |
| [principle-explain-the-number](../.agents/skills/principle-explain-the-number/SKILL.md) | Reviewed and retained |
| [principle-fix-root-causes](../.agents/skills/principle-fix-root-causes/SKILL.md) | Updated |
| [principle-foundational-thinking](../.agents/skills/principle-foundational-thinking/SKILL.md) | Reviewed and retained |
| [principle-guard-the-context-window](../.agents/skills/principle-guard-the-context-window/SKILL.md) | Reviewed and retained |
| [principle-laziness-protocol](../.agents/skills/principle-laziness-protocol/SKILL.md) | Reviewed and retained |
| [principle-make-operations-idempotent](../.agents/skills/principle-make-operations-idempotent/SKILL.md) | Updated |
| [principle-migrate-callers-then-delete-legacy-apis](../.agents/skills/principle-migrate-callers-then-delete-legacy-apis/SKILL.md) | Reviewed and retained |
| [principle-minimize-reader-load](../.agents/skills/principle-minimize-reader-load/SKILL.md) | Reviewed and retained |
| [principle-model-the-domain](../.agents/skills/principle-model-the-domain/SKILL.md) | Reviewed and retained |
| [principle-never-block-on-the-human](../.agents/skills/principle-never-block-on-the-human/SKILL.md) | Reviewed and retained |
| [principle-outcome-oriented-execution](../.agents/skills/principle-outcome-oriented-execution/SKILL.md) | Reviewed and retained |
| [principle-prove-it-works](../.agents/skills/principle-prove-it-works/SKILL.md) | Updated |
| [principle-redesign-from-first-principles](../.agents/skills/principle-redesign-from-first-principles/SKILL.md) | Reviewed and retained |
| [principle-separate-before-serializing-shared-state](../.agents/skills/principle-separate-before-serializing-shared-state/SKILL.md) | Reviewed and retained |
| [principle-sequence-verifiable-units](../.agents/skills/principle-sequence-verifiable-units/SKILL.md) | Reviewed and retained |
| [principle-subtract-before-you-add](../.agents/skills/principle-subtract-before-you-add/SKILL.md) | Reviewed and retained |
| [principle-test-behavior-not-implementation](../.agents/skills/principle-test-behavior-not-implementation/SKILL.md) | Updated |
| [principle-type-system-discipline](../.agents/skills/principle-type-system-discipline/SKILL.md) | Reviewed and retained |
| [recall](../.agents/skills/recall/SKILL.md) | Updated |
| [reflect](../.agents/skills/reflect/SKILL.md) | Updated |
| [setup-pstack](../.agents/skills/setup-pstack/SKILL.md) | Updated |
| [sharpen](../.agents/skills/sharpen/SKILL.md) | Added |
| [show-me-your-work](../.agents/skills/show-me-your-work/SKILL.md) | Updated |
| [swarm](../.agents/skills/swarm/SKILL.md) | Updated |
| [tdd](../.agents/skills/tdd/SKILL.md) | Updated |
| [teach](../.agents/skills/teach/SKILL.md) | Reviewed and retained |
| [technical-writing](../.agents/skills/technical-writing/SKILL.md) | Reviewed and retained |
| [thermo-nuclear-code-quality-review](../.agents/skills/thermo-nuclear-code-quality-review/SKILL.md) | Added |
| [thermo-nuclear-review](../.agents/skills/thermo-nuclear-review/SKILL.md) | Added |
| [thermos](../.agents/skills/thermos/SKILL.md) | Added |
| [typescript-best-practices](../.agents/skills/typescript-best-practices/SKILL.md) | Updated |
| [unslop](../.agents/skills/unslop/SKILL.md) | Reviewed and retained |
| [what-did-i-get-done](../.agents/skills/what-did-i-get-done/SKILL.md) | Added |
| [why](../.agents/skills/why/SKILL.md) | Updated |

## Verification limits

Run `npm run check` and `npm test` for the portable bundle and installer. The optional Bun helper suite and TypeScript checks run from `.agents/skills/poteto-mode/scripts/`. Actual provider access, persistent scheduling, independent reviewers, live browsers, deployment tools, and formal-verification engines still come from the host. Static validation does not establish live operation in every external harness.
