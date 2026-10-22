import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { stage } from './refresh-skills.mjs';
import { audit, defaultTranscriptRoots } from '../.agents/skills/poteto-mode/scripts/worktree-audit.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const helpers = join(root, '.agents/skills/poteto-mode/scripts');

function temporary(t) {
  const directory = mkdtempSync(join(tmpdir(), 'pstack workflow '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('stages additions for review, excludes provider adapters, and leaves the source unchanged', t => {
  const directory = temporary(t);
  const source = join(directory, 'source');
  mkdirSync(join(source, 'skills/poteto-mode/references'), { recursive: true });
  const skill = '---\nname: poteto-mode\ndescription: Main workflow\n---\n\n# Poteto mode\n\nUse `.claude/skills/example/`.\n';
  writeFileSync(join(source, 'skills/poteto-mode/SKILL.md'), skill);
  writeFileSync(join(source, 'skills/poteto-mode/references/codex-tools.md'), 'provider adapter');
  const output = join(directory, 'review');
  assert.equal(stage({ source, output }).files, 1);
  assert.equal(readFileSync(join(source, 'skills/poteto-mode/SKILL.md'), 'utf8'), skill);
  assert.ok(readFileSync(join(output, '.agents/skills/poteto-mode/SKILL.md'), 'utf8').includes('`.agents/skills/example/`'));
  assert.equal(existsSync(join(output, '.agents/skills/poteto-mode/references/codex-tools.md')), false);
  assert.throws(() => stage({ source, output }), /must be empty/);
  assert.throws(() => stage({ source, output: join(root, 'generated') }), /separate directory/);
});

test('publishes a discoverable checkpoint and refuses changed evidence', t => {
  const directory = temporary(t);
  execFileSync('git', ['init', '-q', directory]);
  const run = (...args) => spawnSync(process.execPath, [join(helpers, 'resume.mjs'), ...args, '--project', directory], { encoding: 'utf8' });
  const missing = run('read');
  assert.equal(missing.status, 2, missing.stderr);
  assert.equal(JSON.parse(missing.stdout).kind, 'missing');
  const begin = run('begin');
  assert.equal(begin.status, 0, begin.stderr);
  const allocation = JSON.parse(begin.stdout);
  const checkpoint = allocation.directory ?? allocation.checkpointDir;
  assert.equal(typeof checkpoint, 'string', begin.stdout);
  const note = join(checkpoint, 'resume.md');
  const artifact = join(checkpoint, 'evidence.txt');
  writeFileSync(artifact, 'observed output\n');
  writeFileSync(note, '# Resume\n\nContinue the verified task. Read [evidence](evidence.txt).\n');
  const publish = run('publish', '--note', note, '--artifact', artifact);
  assert.equal(publish.status, 0, publish.stderr);
  const read = run('read');
  assert.equal(read.status, 0, read.stderr);
  assert.equal(JSON.parse(read.stdout).kind, 'checkpoint');
  writeFileSync(artifact, 'changed evidence\n');
  const changed = run('read');
  assert.equal(changed.status, 1);
  assert.equal(JSON.parse(changed.stdout).kind, 'unavailable');
});

test('project playbook extensions must resolve their declared bundled step', t => {
  const directory = temporary(t);
  mkdirSync(join(directory, '.agents/playbooks'), { recursive: true });
  const path = join(directory, '.agents/playbooks/custom.md');
  writeFileSync(path, '---\nwhen: custom feature work\nextends: feature\n---\n\n- **After** "1. `how` over the affected subsystem." add the project check.\n');
  const valid = spawnSync(process.execPath, [join(helpers, 'check-playbooks.mjs'), directory], { encoding: 'utf8' });
  assert.equal(valid.status, 0, valid.stdout + valid.stderr);
  writeFileSync(path, '---\nwhen: custom feature work\nextends: feature\n---\n\n- **After** "a step that does not exist" add the project check.\n');
  const result = spawnSync(process.execPath, [join(helpers, 'check-playbooks.mjs'), directory], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /not in any playbook it extends/);
});

test('cleanup keeps missing transcript evidence unknown and protects untracked work', t => {
  const directory = temporary(t);
  const repo = join(directory, 'repo');
  const remote = join(directory, 'remote');
  const worktree = join(directory, 'candidate');
  execFileSync('git', ['init', '--bare', '-q', remote]);
  execFileSync('git', ['init', '-q', '-b', 'main', repo]);
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { stdio: 'pipe' });
  writeFileSync(join(repo, 'README.md'), 'fixture\n');
  git('add', 'README.md');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture');
  git('remote', 'add', 'origin', remote);
  git('push', '-qu', 'origin', 'main');
  git('remote', 'set-head', 'origin', 'main');
  git('worktree', 'add', '-q', '-b', 'candidate', worktree);
  assert.deepEqual(defaultTranscriptRoots({ env: {}, home: directory, stat: () => ({}) }), []);
  const clean = audit({ repo, transcripts: [], gh: () => '[]', warn: () => {} });
  assert.equal(clean.trim().split('\n')[1].split('\t')[7], 'review');
  writeFileSync(join(worktree, 'untracked.txt'), 'keep my work\n');
  const dirty = audit({ repo, transcripts: [], gh: () => '[]', warn: () => {} });
  assert.equal(dirty.trim().split('\n')[1].split('\t')[7], 'hold-untracked');
  assert.equal(readFileSync(join(worktree, 'untracked.txt'), 'utf8'), 'keep my work\n');
});
