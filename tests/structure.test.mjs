import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const lines = (p) => read(p).split('\n').length;

const MAX_SKILLS = 12;
const MAX_MODEL_INVOCABLE = 10;
const MAX_SKILL_LINES = 200;
const MAX_POLICY_LINES = 150;
const SKILL_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ALLOWED_FRONTMATTER = new Set([
  'name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools',
  'disable-model-invocation',
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([a-z-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2];
  }
  return fields;
}

const skills = readdirSync(join(root, 'skills'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

test('skill count stays within the budget', () => {
  assert.ok(skills.length <= MAX_SKILLS, `${skills.length} skills; the cap is ${MAX_SKILLS} (see CONTRIBUTING.md)`);
  const invocable = skills.filter((s) => frontmatter(read(`skills/${s}/SKILL.md`))['disable-model-invocation'] !== 'true');
  assert.ok(invocable.length <= MAX_MODEL_INVOCABLE, `${invocable.length} model-invocable skills; the cap is ${MAX_MODEL_INVOCABLE}`);
});

for (const skill of skills) {
  test(`skill ${skill} follows the skill contract`, () => {
    const path = `skills/${skill}/SKILL.md`;
    assert.ok(existsSync(join(root, path)), `${path} missing`);
    const text = read(path);
    const fm = frontmatter(text);
    assert.ok(fm, 'frontmatter missing');
    assert.equal(fm.name, skill, 'frontmatter name must equal the directory name');
    assert.match(fm.name, SKILL_NAME);
    assert.ok(fm.name.length <= 64);
    assert.ok(fm.description && fm.description.length >= 80, 'description too short to route on');
    assert.ok(fm.description.length <= 1024, `description is ${fm.description.length} chars; Agent Skills allows 1024`);
    for (const key of Object.keys(fm)) {
      assert.ok(ALLOWED_FRONTMATTER.has(key), `unsupported frontmatter key: ${key}`);
    }
    assert.ok(lines(path) <= MAX_SKILL_LINES, `${lines(path)} lines; budget is ${MAX_SKILL_LINES}`);
    assert.match(text, /^## Output$/m, 'every skill declares its output artifact');
    if (skill !== 'adopt') {
      assert.ok(text.includes(`.engineering/overrides/${skill}.md`), 'skill must read its project override');
    }
  });
}

test('core policy stays short enough to load in every session', () => {
  assert.ok(lines('core/policy.md') <= MAX_POLICY_LINES, `core/policy.md has ${lines('core/policy.md')} lines`);
});

test('every $HARNESS path reference resolves', () => {
  const files = ['core', 'skills', 'profiles', 'templates', 'adapters'].flatMap((d) => walk(d)).filter((f) => f.endsWith('.md'));
  const missing = [];
  for (const file of files) {
    for (const [, ref] of read(file).matchAll(/\$HARNESS\/([A-Za-z0-9_.\/-]+[A-Za-z0-9_])/g)) {
      const target = ref.replace(/\/$/, '');
      if (target.includes('<')) continue;
      if (!existsSync(join(root, target))) missing.push(`${file}: $HARNESS/${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('relative markdown links resolve', () => {
  const files = walk('.').filter((f) => f.endsWith('.md') && !f.startsWith('node_modules'));
  const broken = [];
  for (const file of files) {
    for (const [, href] of read(file).matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:|#)/.test(href) || href.includes('<')) continue;
      const target = href.split('#')[0];
      if (!existsSync(resolve(root, dirname(file), target))) broken.push(`${file} -> ${href}`);
    }
  }
  assert.deepEqual(broken, []);
});

test('agent-neutral layers do not mention a specific agent', () => {
  const adapterTemplates = new Set(['templates/CLAUDE.md', 'templates/claude-settings.json']);
  const neutral = ['core', 'skills', 'profiles', 'templates'].flatMap((d) => walk(d)).filter((f) => !adapterTemplates.has(f));
  const agentSpecific = /CLAUDE_|Claude Code|claude\.md|\.claude\/|\.codex\/|copilot-instructions|TodoWrite|AskUserQuestion|\bBash tool\b|\bRead tool\b|\bAgent tool\b|Copilot|Codex/i;
  const hits = neutral.filter((f) => agentSpecific.test(read(f).replace(/^---\n[\s\S]*?\n---\n/, '')));
  assert.deepEqual(hits, []);
});

test('a rule is written in one place: no sentence repeats across harness files', () => {
  const files = ['core', 'skills', 'profiles'].flatMap((d) => walk(d)).filter((f) => f.endsWith('.md'));
  const seen = new Map();
  for (const file of files) {
    const prose = read(file)
      .replace(/^---\n[\s\S]*?\n---\n/, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\n(?!\n|\s*[-|#\d])/g, ' ');
    for (const raw of prose.split(/(?<=[.!?])\s+|\n/)) {
      if (/^\s*[#|]/.test(raw)) continue;
      const sentence = raw.toLowerCase().replace(/[`*_|]/g, '').replace(/^[\s\d.-]+/, '').replace(/\s+/g, ' ').trim();
      if (sentence.length < 30) continue;
      if (!seen.has(sentence)) seen.set(sentence, new Set());
      seen.get(sentence).add(file);
    }
  }
  const repeated = [...seen].filter(([, where]) => where.size > 1).map(([s, where]) => `${[...where].join(' + ')}: ${s}`);
  assert.deepEqual(repeated, []);
});

test('version is consistent across VERSION, plugin manifest, and changelog', () => {
  const version = read('VERSION').trim();
  assert.match(version, /^\d+\.\d+\.\d+$/);
  const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
  assert.equal(plugin.version, version);
  assert.ok(read('CHANGELOG.md').includes(`## [${version}]`), 'CHANGELOG.md needs an entry for the current version');
  const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
  for (const entry of marketplace.plugins) {
    assert.equal(entry.version, undefined, 'version lives only in plugin.json');
  }
});

test('the Claude Code adapter wires the context loader', () => {
  const plugin = JSON.parse(read('.claude-plugin/plugin.json'));
  const marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
  const entry = marketplace.plugins.find((p) => p.name === plugin.name);
  assert.ok(entry, 'marketplace lists the plugin');
  assert.equal(entry.source, './');
  const hooks = JSON.parse(read(plugin.hooks));
  const command = hooks.hooks.SessionStart[0].hooks[0].command;
  assert.ok(command.includes('/bin/eng-context'));
  assert.ok(statSync(join(root, 'bin/eng-context')).mode & 0o111, 'bin/eng-context must be executable');

  const settings = JSON.parse(read('templates/claude-settings.json'));
  assert.deepEqual(Object.keys(settings.enabledPlugins), [`${plugin.name}@${marketplace.name}`]);
  assert.ok(settings.extraKnownMarketplaces[marketplace.name]);
});

test('profiles follow the profile contract', () => {
  const sections = ['## Detection', '## Verification ladder', '## Conventions to discover', '## Pitfalls', '## References'];
  const profiles = readdirSync(join(root, 'profiles'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const readme = read('profiles/README.md');
  for (const profile of profiles) {
    const text = read(`profiles/${profile}/PROFILE.md`);
    const positions = sections.map((s) => text.search(new RegExp(`^${s}$`, 'm')));
    assert.ok(positions.every((p) => p >= 0), `${profile}: missing sections ${sections.filter((_, i) => positions[i] < 0)}`);
    assert.deepEqual([...positions].sort((a, b) => a - b), positions, `${profile}: sections out of order`);
    assert.ok(readme.includes(`\`${profile}\``), `${profile} not listed in profiles/README.md`);
    for (const script of existsSync(join(root, `profiles/${profile}/scripts`)) ? walk(`profiles/${profile}/scripts`) : []) {
      assert.ok(statSync(join(root, script)).mode & 0o111, `${script} must be executable`);
    }
  }
});

test('harness.yaml files use only the flat keys the loader reads', () => {
  const files = ['templates/harness.yaml', 'examples/dotnet-angular-app/.engineering/harness.yaml'];
  for (const file of files) {
    const keys = read(file).split('\n').filter((l) => l.trim() && !l.trimStart().startsWith('#')).map((l) => l.split(':')[0]);
    assert.deepEqual(keys, ['harness', 'profiles', 'adr_dir'], file);
  }
});
