#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const profiles = {
  generic: ['AGENTS.md'],
  codex: ['AGENTS.md'],
  cursor: ['AGENTS.md'],
  opencode: ['AGENTS.md'],
  pi: ['AGENTS.md'],
  claude: ['CLAUDE.md'],
  gemini: ['GEMINI.md'],
  copilot: ['.github/copilot-instructions.md'],
};
profiles.all = [...new Set(Object.values(profiles).flat())];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const start = '<!-- pstack:start -->';
const end = '<!-- pstack:end -->';
const block = `${start}
## Pstack workflows

For engineering tasks, read \`.agents/skills/poteto-mode/SKILL.md\` and follow its routing.
Before using any pstack workflow, read \`.agents/skills/poteto-mode/references/harness.md\`.
Resolve these paths from the project root. Skills and named agent definitions live under
\`.agents/skills\` and \`.agents/agents\`. Optional role overrides live in \`.agents/pstack-models.md\`.
With no override, inherit the current session's model. Adapt to available tools and report unmet gates.
System instructions and the user's scope take precedence over workflow instructions.
${end}`;

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function filesAt(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git', 'pstack-models.md', 'pstack-install.json'].includes(entry.name)) return [];
    const path = join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Source symlink is not supported: ${path}`);
    return entry.isDirectory() ? filesAt(join(directory, entry.name), path) : [path];
  });
}

function safeTarget(target, path) {
  const absolute = resolve(target, path);
  const rel = relative(target, absolute);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`Path must stay inside the target project: ${path}`);
  }
  let cursor = target;
  for (const part of ['', ...rel.split(sep)]) {
    cursor = join(cursor, part);
    try {
      if (lstatSync(cursor).isSymbolicLink()) throw new Error(`Refusing target symlink: ${cursor}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return absolute;
}

export function install({ target, harness = 'generic', instructions, dryRun = false, source = root }) {
  if (!target) throw new Error('Pass --target with the project directory.');
  if (!Object.hasOwn(profiles, harness)) throw new Error(`Unknown harness: ${harness}`);
  target = resolve(target);
  const instructionFiles = instructions ? [instructions] : profiles[harness];
  for (const path of instructionFiles) {
    const absolute = safeTarget(target, path);
    const normalized = relative(target, absolute).replaceAll('\\', '/').toLowerCase();
    if (!path.endsWith('.md') || normalized.startsWith('.agents/')) {
      throw new Error('The instruction file must be a Markdown file outside .agents.');
    }
  }
  const manifestPath = safeTarget(target, '.agents/pstack-install.json');
  const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { files: {} };
  if (!previous.files || typeof previous.files !== 'object' || Array.isArray(previous.files)) {
    throw new Error('Invalid pstack install manifest.');
  }
  const files = { ...previous.files };
  const writes = [];
  const conflicts = [];
  for (const path of filesAt(join(source, '.agents'))) {
    const dest = join('.agents', path);
    const absolute = safeTarget(target, dest);
    const bytes = readFileSync(join(source, '.agents', path));
    files[dest.replaceAll('\\', '/')] = hash(bytes);
    if (existsSync(absolute)) {
      const currentHash = hash(readFileSync(absolute));
      if (currentHash === hash(bytes)) continue;
      if (previous.files[dest.replaceAll('\\', '/')] !== currentHash) {
        conflicts.push(dest);
        continue;
      }
    }
    writes.push([absolute, bytes]);
  }
  const notices = ['LICENSE', 'NOTICE.md', ...['LICENSE-cursor-team-kit', 'LICENSE-thermos'].filter(name => existsSync(join(source, name)))];
  for (const name of notices) {
    const dest = `.agents/pstack-notices/${name}`;
    const absolute = safeTarget(target, dest);
    const bytes = readFileSync(join(source, name));
    files[dest] = hash(bytes);
    if (existsSync(absolute)) {
      const currentHash = hash(readFileSync(absolute));
      if (currentHash === hash(bytes)) continue;
      if (previous.files[dest] !== currentHash) {
        conflicts.push(dest);
        continue;
      }
    }
    writes.push([absolute, bytes]);
  }
  for (const path of instructionFiles) {
    const absolute = safeTarget(target, path);
    const exists = existsSync(absolute);
    const current = exists ? readFileSync(absolute, 'utf8') : '';
    const prefix = !exists && path === 'CLAUDE.md' && existsSync(safeTarget(target, 'AGENTS.md'))
      ? '@AGENTS.md\n\n' : '';
    const starts = current.split(start).length - 1;
    const ends = current.split(end).length - 1;
    if (starts !== ends || starts > 1 || (starts && current.indexOf(end) < current.indexOf(start))) {
      throw new Error(`Malformed pstack instruction block in ${path}`);
    }
    const next = starts
      ? current.slice(0, current.indexOf(start)) + block + current.slice(current.indexOf(end) + end.length)
      : prefix + current + (current && !current.endsWith('\n') ? '\n\n' : current ? '\n' : '') + block + '\n';
    if (current !== next) writes.push([absolute, next]);
  }
  if (conflicts.length) throw new Error(`Existing files differ. Merge them before installing:\n${conflicts.join('\n')}`);
  if (!dryRun) {
    for (const [path, bytes] of writes) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, bytes);
    }
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify({ version: 1, files }, null, 2) + '\n');
  }
  return { target, harness, instructionFiles, changedFiles: writes.length, dryRun };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const options = {};
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (arg === '--help') {
        console.log(`Usage: node scripts/install.mjs --target <project> [--harness ${Object.keys(profiles).join('|')}] [--instructions <relative.md>] [--dry-run]`);
        process.exit(0);
      }
      if (arg === '--dry-run') options.dryRun = true;
      else if (['--target', '--harness', '--instructions'].includes(arg)) {
        const value = args[++index];
        if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
        options[arg.slice(2)] = value;
      } else throw new Error(`Unknown option: ${arg}`);
    }
    console.log(JSON.stringify(install(options), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
