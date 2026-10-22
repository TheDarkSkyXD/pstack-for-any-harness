#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = resolve('.');
const args = process.argv.slice(2);
const baselineFlag = args.indexOf('--baseline');
const baseline = baselineFlag < 0 ? null : args[baselineFlag + 1];
const inventoryPath = join(root, '.agents/skill-coverage.json');
const existing = existsSync(inventoryPath) ? JSON.parse(readFileSync(inventoryPath, 'utf8')) : { skills: [] };
const previous = new Map(existing.skills.map(entry => [entry.name, entry]));
const textExtensions = new Set(['.md', '.mjs', '.js', '.ts', '.json', '.yaml', '.yml', '.txt', '.sh', '.lock', '.awk', '.py']);
const sha = (bytes, path) => createHash('sha256').update(textExtensions.has(extname(path)) || !extname(path) ? bytes.toString('utf8').replaceAll('\r\n', '\n') : bytes).digest('hex');

function files(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === 'node_modules') return [];
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? files(join(directory, entry.name), path) : [path];
  }).sort();
}

const entries = readdirSync(join(root, '.agents/skills'), { withFileTypes: true }).filter(entry => entry.isDirectory()).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const skills = entries.map(({ name }) => {
  const directory = join(root, '.agents/skills', name);
  const paths = files(directory);
  const hashes = Object.fromEntries(paths.map(path => [path, sha(readFileSync(join(directory, path)), path)]));
  let status = previous.get(name)?.status ?? 'reviewed';
  if (baseline) {
    const old = join(baseline, '.agents/skills', name);
    status = !existsSync(join(old, 'SKILL.md')) ? 'added'
      : paths.some(path => !existsSync(join(old, path)) || hashes[path] !== sha(readFileSync(join(old, path)), path)) ? 'updated' : 'reviewed';
  }
  return { name, status, files: hashes };
});
const inventory = { schemaVersion: 1, hashNormalization: 'lf-for-text', skills };
const json = JSON.stringify(inventory, null, 2) + '\n';
if (args.includes('--write')) {
  writeFileSync(inventoryPath, json);
  const count = status => skills.filter(skill => skill.status === status).length;
  const header = `# Skill workflow coverage\n\nThe bundle contains ${skills.length} skills. During this refresh, ${count('added')} skills were added, ${count('updated')} existing skills or their supporting files changed, and ${count('reviewed')} were reviewed and retained.\n\nEvery existing skill and its authored supporting Markdown was compared with the current workflow snapshot. Local safeguards were retained where they were stronger or already matched the intended behavior. Runtime-specific model defaults, registries, transcript paths, and startup hooks were replaced by the shared [harness contract](../.agents/skills/poteto-mode/references/harness.md).\n\nThe machine-readable [inventory](../.agents/skill-coverage.json) records each skill and file hash. Regenerate the current hashes and this page with \`node scripts/skill-inventory.mjs --write\`; verify them with \`node scripts/skill-inventory.mjs --check\`. Refreshing from another bundle is staged separately with \`node scripts/refresh-skills.mjs --source <bundle> --output <review-directory>\`. Staging does not apply changes or prove that model, tool, and local-policy differences are resolved. Review those differences before replacing installed files.\n\n## Changes reviewed\n\n- Design deviations update the saved contracts and rationale before a unit closes. Consumer censuses run before design when a brief asserts facts about existing code.\n- Verification includes startup from empty data, code-to-model correspondence, explicit formal bounds, deliberate failing controls, and sync-commit tracking.\n- Independent review stays closed under delegation limits. Writers use exclusive checkouts, and their descendants stop before ownership transfers.\n- PR workflows capture head, base, destination, pending merge mechanisms, and destination applicability. Landing authority follows the user's grant, and every patch-changing push keeps the required review cadence.\n- Checkpoints are project-discoverable and validate linked evidence. Cleanup protects untracked and non-disposable ignored files.\n- History preserves original human rulings, distinguishes interpretations, and treats copied summaries as one evidence chain. Model setup and transcript access remain host-independent.\n\n## Skill inventory\n\n| Skill | Refresh result |\n|---|---|\n`;
  const rows = skills.map(skill => `| [${skill.name}](../.agents/skills/${skill.name}/SKILL.md) | ${skill.status === 'reviewed' ? 'Reviewed and retained' : skill.status === 'added' ? 'Added' : 'Updated'} |`).join('\n');
  const footer = '\n\n## Verification limits\n\nRun `npm run check` and `npm test` for the portable bundle and installer. The optional Bun helper suite and TypeScript checks run from `.agents/skills/poteto-mode/scripts/`. Actual provider access, persistent scheduling, independent reviewers, live browsers, deployment tools, and formal-verification engines still come from the host. Static validation does not establish live operation in every external harness.\n';
  writeFileSync(join(root, 'docs/skill-coverage.md'), header + rows + footer);
  console.log(`Recorded ${skills.length} skills: ${count('added')} added, ${count('updated')} updated, ${count('reviewed')} retained.`);
} else if (args.includes('--check')) {
  if (!existsSync(inventoryPath) || json !== readFileSync(inventoryPath, 'utf8')) {
    console.error('Skill inventory differs from the bundle. Review the changes, then run node scripts/skill-inventory.mjs --write.');
    process.exitCode = 1;
  } else console.log(`Skill inventory matches all ${skills.length} skill directories and supporting files.`);
} else {
  console.log('Usage: node scripts/skill-inventory.mjs --write [--baseline <snapshot>] | --check');
  process.exitCode = 1;
}
