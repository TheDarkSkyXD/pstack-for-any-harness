import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, readdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { install, profiles } from './install.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'pstack install test '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'source');
  const target = join(root, 'target project');
  const skill = '.agents/skills/example/SKILL.md';
  mkdirSync(join(source, '.agents/skills/example/node_modules'), { recursive: true });
  writeFileSync(join(source, skill), 'original skill\n');
  writeFileSync(join(source, '.agents/skills/example/node_modules/private'), 'do not copy');
  writeFileSync(join(source, '.agents/pstack-models.md'), 'source-only model choices');
  writeFileSync(join(source, 'LICENSE'), 'license notice\n');
  writeFileSync(join(source, 'NOTICE.md'), 'attribution\n');
  return { source, target, skill, options: { source, target } };
}

test('every profile installs a readable bundle and an instruction entry point', t => {
  const { source, target, skill } = fixture(t);
  for (const [harness, instructionFiles] of Object.entries(profiles)) {
    const project = join(target, harness);
    install({ source, target: project, harness });
    assert.equal(readFileSync(join(project, skill), 'utf8'), 'original skill\n');
    assert.equal(readFileSync(join(project, '.agents/pstack-notices/LICENSE'), 'utf8'), 'license notice\n');
    for (const path of instructionFiles) {
      const content = readFileSync(join(project, path), 'utf8');
      assert.ok(content.includes('.agents/skills/poteto-mode/SKILL.md'));
      assert.ok(content.includes('.agents/skills/poteto-mode/references/harness.md'));
    }
    assert.equal(existsSync(join(project, '.agents/skills/example/node_modules')), false);
    assert.equal(existsSync(join(project, '.agents/pstack-models.md')), false);
  }
});

test('reruns preserve instructions, custom skills, and model settings without duplicate routing', t => {
  const { options, target } = fixture(t);
  mkdirSync(join(target, '.agents/skills/custom'), { recursive: true });
  writeFileSync(join(target, 'AGENTS.md'), '# Project rules\nUse our checks.\n');
  writeFileSync(join(target, '.agents/pstack-models.md'), 'bug-fix: private-model\n');
  writeFileSync(join(target, '.agents/skills/custom/SKILL.md'), 'custom skill\n');
  install(options);
  const first = readFileSync(join(target, 'AGENTS.md'), 'utf8');
  assert.equal(install(options).changedFiles, 0);
  assert.equal(readFileSync(join(target, 'AGENTS.md'), 'utf8'), first);
  assert.ok(first.startsWith('# Project rules\nUse our checks.\n'));
  assert.equal(first.split('<!-- pstack:start -->').length - 1, 1);
  assert.equal(readFileSync(join(target, '.agents/pstack-models.md'), 'utf8'), 'bug-fix: private-model\n');
  assert.equal(readFileSync(join(target, '.agents/skills/custom/SKILL.md'), 'utf8'), 'custom skill\n');
});

test('updates an unmodified installed file and refuses local edits before writing anything', t => {
  const { options, source, target, skill } = fixture(t);
  install(options);
  writeFileSync(join(source, skill), 'updated upstream skill\n');
  install(options);
  assert.equal(readFileSync(join(target, skill), 'utf8'), 'updated upstream skill\n');
  writeFileSync(join(target, skill), 'my local skill\n');
  writeFileSync(join(source, '.agents/skills/example/new.md'), 'new upstream file\n');
  assert.throws(() => install(options), /Existing files differ/);
  assert.equal(readFileSync(join(target, skill), 'utf8'), 'my local skill\n');
  assert.equal(existsSync(join(target, '.agents/skills/example/new.md')), false);
});

test('remembers retired files so later releases can restore them without false conflicts', t => {
  const { options, source, target, skill } = fixture(t);
  install(options);
  rmSync(join(source, skill));
  install(options);
  assert.equal(readFileSync(join(target, skill), 'utf8'), 'original skill\n');
  writeFileSync(join(source, skill), 'restored upstream skill\n');
  install(options);
  assert.equal(readFileSync(join(target, skill), 'utf8'), 'restored upstream skill\n');
  rmSync(join(source, skill));
  install(options);
  writeFileSync(join(target, skill), 'my customized retired skill\n');
  writeFileSync(join(source, skill), 'another upstream release\n');
  assert.throws(() => install(options), /Existing files differ/);
  assert.equal(readFileSync(join(target, skill), 'utf8'), 'my customized retired skill\n');
});

test('first installation refuses collisions and dry-run creates no project', t => {
  const { options, target, skill } = fixture(t);
  const preview = install({ ...options, dryRun: true });
  assert.equal(preview.dryRun, true);
  assert.equal(existsSync(target), false);
  mkdirSync(join(target, '.agents/skills/example'), { recursive: true });
  writeFileSync(join(target, skill), 'existing project skill\n');
  assert.throws(() => install(options), /Existing files differ/);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
});

test('carries additional MIT notices without replacing the destination project license', t => {
  const { options, source, target } = fixture(t);
  writeFileSync(join(source, 'LICENSE-cursor-team-kit'), 'team toolkit copyright\n');
  writeFileSync(join(source, 'LICENSE-thermos'), 'review toolkit copyright\n');
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'LICENSE'), 'destination project license\n');
  install(options);
  assert.equal(readFileSync(join(target, '.agents/pstack-notices/LICENSE-cursor-team-kit'), 'utf8'), 'team toolkit copyright\n');
  assert.equal(readFileSync(join(target, '.agents/pstack-notices/LICENSE-thermos'), 'utf8'), 'review toolkit copyright\n');
  assert.equal(readFileSync(join(target, 'LICENSE'), 'utf8'), 'destination project license\n');
});

test('rejects escaping paths, malformed instructions, and missing CLI values', t => {
  const { options, target } = fixture(t);
  assert.throws(() => install({ ...options, instructions: '../outside.md' }), /inside the target/);
  assert.throws(() => install({ ...options, instructions: '.agents/skills/example/SKILL.md' }), /outside .agents/);
  assert.throws(() => install({ ...options, instructions: 'docs/../.agents/skills/example/SKILL.md' }), /outside .agents/);
  assert.throws(() => install({ ...options, harness: 'unknown' }), /Unknown harness/);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'AGENTS.md'), 'rules\n<!-- pstack:start -->\nbroken block\n');
  assert.throws(() => install(options), /Malformed pstack/);
  assert.deepEqual(readdirSync(target), ['AGENTS.md']);
  const cli = spawnSync(process.execPath, ['scripts/install.mjs', '--target'], { encoding: 'utf8' });
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /Missing value for --target/);
});

test('uses a custom instruction file and preserves content after an existing routing block', t => {
  const { options, target } = fixture(t);
  install({ ...options, instructions: 'docs/agent.md' });
  const path = join(target, 'docs/agent.md');
  const first = readFileSync(path, 'utf8') + '\n# Other instructions\nKeep this.\n';
  writeFileSync(path, first);
  install({ ...options, instructions: 'docs/agent.md' });
  assert.equal(readFileSync(path, 'utf8'), first);
  assert.equal(existsSync(join(target, 'AGENTS.md')), false);
});

test('a new Claude instruction file imports existing shared project rules', t => {
  const { options, target } = fixture(t);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'AGENTS.md'), '# Shared rules\nRun our project checks.\n');
  install({ ...options, harness: 'claude' });
  assert.ok(readFileSync(join(target, 'CLAUDE.md'), 'utf8').startsWith('@AGENTS.md\n\n'));
  assert.equal(readFileSync(join(target, 'AGENTS.md'), 'utf8'), '# Shared rules\nRun our project checks.\n');
  assert.equal(install({ ...options, harness: 'claude' }).changedFiles, 0);
});

test('refuses destination links instead of writing into another project', t => {
  const { options, target } = fixture(t);
  const outside = join(target, '..', 'outside');
  mkdirSync(outside, { recursive: true });
  mkdirSync(target, { recursive: true });
  symlinkSync(outside, join(target, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => install(options), /Refusing target symlink/);
  assert.deepEqual(readdirSync(outside), []);
});

test('the real CLI installs all source skills and the checker rejects a fixed model default', t => {
  const { target } = fixture(t);
  const cli = spawnSync(process.execPath, ['scripts/install.mjs', '--target', target, '--harness', 'all'], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stderr);
  const installed = JSON.parse(cli.stdout);
  assert.equal(installed.target, target);
  assert.ok(existsSync(join(target, '.agents/skills/poteto-mode/references/harness.md')));
  assert.ok(existsSync(join(target, '.agents/agents/comment-sicko.md')));
  let check = spawnSync(process.execPath, ['scripts/check-portability.mjs', '--root', target], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  const inventory = spawnSync(process.execPath, [join(process.cwd(), 'scripts/skill-inventory.mjs'), '--check'], { encoding: 'utf8', cwd: target });
  assert.equal(inventory.status, 0, inventory.stderr);
  const brokenModule = join(target, '.agents/skills/poteto-mode/scripts/broken-fixture.mjs');
  writeFileSync(brokenModule, "import './missing-fixture.mjs';\n");
  check = spawnSync(process.execPath, ['scripts/check-portability.mjs', '--root', target], { encoding: 'utf8' });
  assert.equal(check.status, 1);
  assert.match(check.stderr, /missing local helper import/);
  rmSync(brokenModule);
  writeFileSync(join(target, '.agents/skills/swarm/SKILL.md'), readFileSync(join(target, '.agents/skills/swarm/SKILL.md'), 'utf8') + '\nDefault model: grok-4.7-xhigh-fast\n');
  check = spawnSync(process.execPath, ['scripts/check-portability.mjs', '--root', target], { encoding: 'utf8' });
  assert.equal(check.status, 1);
  assert.match(check.stderr, /fixed provider model ID/);
});
