import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--root')) {
  console.error('Usage: node scripts/check-portability.mjs [--root <installed-project>]');
  process.exit(1);
}
const root = args.length ? resolve(args[1]) : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skills = join(root, '.agents/skills');
const errors = [];
const staticSkills = new Set(['bro', 'unslop', 'technical-writing', 'typescript-best-practices', 'in-your-own-words', 'sharpen']);
const banned = [
  [/\b(?:grok-\d[\w.-]*|claude-opus-[\w.-]+|gpt-\d[\w.-]*)\b/g, 'fixed provider model ID'],
  [/\.cursor\/(?:skills|agents)/g, 'Cursor-only bundle path'],
  [/closest valid slug|family.s default|Families go by prefix/g, 'guessed model fallback'],
  [/CLAUDE_(?:CONFIG_DIR|CODE_PLUGIN_CACHE_DIR|PLUGIN_ROOT)/g, 'provider-specific storage assumption'],
  [/subagent_type:\s*"\.agents\//g, 'file path used as a native agent registry ID'],
];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === 'node_modules') return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

for (const file of walk(join(root, '.agents'))) {
  if (/\.(?:mjs|js|ts)$/.test(file) || /\/(?:watch-pr|ship-pr)$/.test(file.replaceAll('\\', '/'))) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:from\s*|import\s*(?:\(\s*)?)['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const target = resolve(dirname(file), match[1]);
      if (![target, `${target}.ts`, `${target}.mjs`, `${target}.js`, join(target, 'index.ts')].some(existsSync)) errors.push(`${file}: missing local helper import ${match[1]}`);
    }
  }
  if (!file.endsWith('.md') || file.endsWith('pstack-models.md')) continue;
  const content = readFileSync(file, 'utf8');
  for (const [pattern, label] of banned) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) errors.push(`${file}: ${label}`);
  }
  const prose = content.replace(/```[\s\S]*?```/g, '');
  for (const match of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0];
    if (!target || /^(?:https?:|[a-z]+:|\/)/i.test(target) || /[<>$]/.test(target)) continue;
    if (!existsSync(resolve(dirname(file), decodeURIComponent(target)))) errors.push(`${file}: broken local link ${target}`);
  }
}

const entries = readdirSync(skills, { withFileTypes: true }).filter(entry => entry.isDirectory());
for (const { name } of entries) {
  const file = join(skills, name, 'SKILL.md');
  if (!existsSync(file)) { errors.push(`${name}: missing SKILL.md`); continue; }
  const content = readFileSync(file, 'utf8');
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) errors.push(`${name}: missing frontmatter`);
  if (!content.includes(`name: ${name}\n`) && !content.includes(`name: ${name}\r\n`)) errors.push(`${name}: name differs from directory`);
  if (!/^description: .+/m.test(content)) errors.push(`${name}: missing description`);
  if (!name.startsWith('principle-') && !staticSkills.has(name)) {
    const match = content.match(/\[the harness contract\]\(([^)]+)\)/);
    if (!match || !existsSync(resolve(dirname(file), match[1]))) errors.push(`${name}: missing or broken runtime contract link`);
  }
}

const runtime = join(skills, 'poteto-mode/references/harness.md');
if (!existsSync(runtime)) errors.push('Missing shared harness contract');
const coverage = join(root, '.agents/skill-coverage.json');
if (existsSync(coverage)) {
  const inventory = JSON.parse(readFileSync(coverage, 'utf8'));
  for (const entry of inventory.skills) {
    if (!existsSync(join(skills, entry.name, 'SKILL.md'))) errors.push(`${entry.name}: missing from reviewed skill inventory`);
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Portability checks passed for ${entries.length} skills. No fixed provider model defaults or guessed family fallbacks.`);
