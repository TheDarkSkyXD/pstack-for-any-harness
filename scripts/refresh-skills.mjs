#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtime = 'Read [the harness contract](../poteto-mode/references/harness.md) before following this workflow. It defines model inheritance, tool fallbacks, and unmet verification gates.';
const staticSkills = new Set(['bro', 'unslop', 'technical-writing', 'typescript-best-practices', 'in-your-own-words', 'sharpen']);

function walk(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git'].includes(entry.name)) return [];
    const path = join(prefix, entry.name);
    return entry.isDirectory() ? walk(join(directory, entry.name), path) : [path];
  });
}

export function adapt(text, path) {
  text = text.replaceAll('\r\n', '\n');
  text = text.replace(/^On (?:Codex|GitHub Copilot|Muse), read the \[platform mapping\].*\n\n/gm, '');
  text = text.replace(/## Platform Adaptation\n[\s\S]*?(?=## Non-negotiables)/, '');
  text = text.replace(/## Models\n[\s\S]*$/, '## Model configuration\n\nRead `.agents/pstack-models.md` when present. Resolve role values, inherited defaults, reasoning effort, and provider identity through the harness contract. Without an override, inherit the current session model. Panel defaults are three independent workers when delegation is available.\n');
  text = text.replace(/`\.claude\/skills\//g, '`.agents/skills/').replaceAll('.claude/skills/', '.agents/skills/');
  text = text.replaceAll('~/.claude/orchestrate/', '<agent-store>/orchestrate/');
  text = text.replaceAll('`pstack-models.md`', '`.agents/pstack-models.md`');
  text = text.replaceAll('plugin-dev:skill-development', 'skill-authoring guidance');
  text = text.replaceAll('pstack:poteto-agent', '.agents/agents/poteto-agent.md');
  text = text.replaceAll('pstack:comment-sicko', '.agents/agents/comment-sicko.md');
  text = text.replaceAll('pstack:thermo-nuclear-review-subagent', '.agents/agents/thermo-nuclear-review-subagent.md');
  text = text.replaceAll('pstack:thermo-nuclear-code-quality-review-subagent', '.agents/agents/thermo-nuclear-code-quality-review-subagent.md');
  text = text.replaceAll('`AskUserQuestion`', "the harness's question interface");
  text = text.replaceAll('`Agent` tool', "active harness's delegation interface");
  text = text.replaceAll('`Agent` calls', 'delegation calls').replaceAll('`Agent` call', 'delegation call');
  text = text.replaceAll('`Agent` subagent', 'general-purpose worker').replaceAll('`Agent` response', 'delegation response');
  text = text.replaceAll('`run_in_background: true`', 'background execution when supported');
  text = text.replaceAll('`subagent_type: "general-purpose"`', 'a general-purpose worker');
  text = text.replace(/If the (?:active harness's delegation interface|`Agent` tool) rejects[^\n]*/g, 'Resolve unavailable model IDs and unsupported options through the harness contract. Never guess a replacement ID.');
  text = text.replace(/If the (?:model )?sheet or (?:that |the )?line is missing, (?:run one each on|use|choose from)[^.!\n]*(?:\[Models\]\(#models\))[^.!\n]*\./g, 'With no override, inherit the current session model; panels use three workers.');
  text = text.replaceAll('[Models](#models)', '[Model configuration](#model-configuration)');
  text = text.replaceAll('[Reasoning effort](#reasoning-effort)', '[the harness contract](../poteto-mode/references/harness.md)');
  text = text.replaceAll('`opus`', '`inherit-parent`').replaceAll('`fable`', '`inherit-parent`').replaceAll('`sonnet`', '`inherit-parent`').replaceAll('`haiku`', '`inherit-parent`');
  text = text.replace(/\| Reviewer D \|[^\n]*\n/g, '');
  text = text.replaceAll('run_in_background: true', 'background execution when supported');
  text = text.replaceAll('`/tmp/arena-<slug>/candidate-<n>/`', 'a separate candidate directory under the host OS temporary directory');
  text = text.replaceAll("Claude Code's `loop` skill", "the active harness's bounded iteration or scheduling capability");
  text = text.replaceAll('`skills/poteto-mode/scripts/', '`.agents/skills/poteto-mode/scripts/');
  text = text.replaceAll('`bun skills/poteto-mode/scripts/', '`bun .agents/skills/poteto-mode/scripts/');
  text = text.replaceAll('<plugin>/skills/', '<project-root>/.agents/skills/');
  if (path.endsWith('/SKILL.md')) {
    const name = path.split('/')[1];
    if (!name.startsWith('principle-') && !staticSkills.has(name)) {
      text = text.replace(/(^# [^\n]+\n)/m, `$1\n## Runtime\n\n${runtime}\n`);
    }
  }
  return text.endsWith('\n') ? text : text + '\n';
}

function sha(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

export function stage({ source, output }) {
  source = resolve(source);
  output = resolve(output);
  if (!existsSync(join(source, 'skills/poteto-mode/SKILL.md'))) throw new Error('Source must contain skills/poteto-mode/SKILL.md.');
  if (output.toLowerCase() === root.toLowerCase() || output.toLowerCase().startsWith(root.toLowerCase() + sep)) throw new Error('Stage into a separate directory, then review the merge.');
  if (existsSync(output) && readdirSync(output).length) throw new Error('The review directory must be empty; existing files will not be overwritten.');
  const records = [];
  for (const path of walk(source)) {
    const posix = path.replaceAll('\\', '/');
    if (!/^(skills|agents)\//.test(posix)) continue;
    if (/\/references\/(?:codex|copilot|muse|pi)-tools\.md$/.test(posix) || /\/references\/licenses\//.test(posix) || /\/references\/agents\//.test(posix)) continue;
    if (/^skills\/reflect\/scripts\/claude-project-dir\.mjs$/.test(posix) || /^skills\/setup-pstack\/(scripts\/|copilot\.md)/.test(posix)) continue;
    const raw = readFileSync(join(source, path));
    const candidate = posix.endsWith('.md') ? Buffer.from(adapt(raw.toString('utf8'), posix)) : raw;
    const dest = join(output, '.agents', path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, candidate);
    const local = join(root, '.agents', path);
    records.push({ path: '.agents/' + posix, sourceHash: sha(raw), candidateHash: sha(candidate), action: existsSync(local) ? 'review-update' : 'add' });
  }
  writeFileSync(join(output, 'inventory.json'), JSON.stringify(records, null, 2) + '\n');
  return { output, files: records.length, newSkills: records.filter(r => r.action === 'add' && r.path.endsWith('/SKILL.md')).map(r => r.path.split('/')[2]) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 4 || args[0] !== '--source' || args[2] !== '--output') throw new Error('Usage: node scripts/refresh-skills.mjs --source <bundle> --output <review-directory>');
    console.log(JSON.stringify(stage({ source: args[1], output: args[3] }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
