import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const example = join(root, 'examples/dotnet-angular-app');
const version = readFileSync(join(root, 'VERSION'), 'utf8').trim();
const [major, minor] = version.split('.');
const line = major === '0' ? `0.${minor}` : major;

function run(script, args) {
  const env = { ...process.env };
  delete env.CLAUDE_PROJECT_DIR;
  const result = spawnSync(join(root, script), args, { encoding: 'utf8', env });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

function project({ yaml, overrides = {}, memory } = {}) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'eng-harness-')));
  mkdirSync(join(dir, '.engineering/overrides'), { recursive: true });
  mkdirSync(join(dir, '.engineering/memory'), { recursive: true });
  writeFileSync(join(dir, '.engineering/harness.yaml'), yaml ?? `harness: "${line}"\nprofiles: [dotnet-angular]\nadr_dir: docs/adr\n`);
  for (const [name, text] of Object.entries(overrides)) writeFileSync(join(dir, `.engineering/overrides/${name}.md`), text);
  if (memory) writeFileSync(join(dir, '.engineering/memory/INDEX.md'), memory);
  return dir;
}

test('eng-context loads policy, overrides, profile, and memory for an adopted project', () => {
  const { code, out } = run('bin/eng-context', ['--check', example]);
  assert.equal(code, 0, out);
  assert.ok(out.startsWith(`# Engineering harness ${version}\n`));
  assert.ok(out.includes(`HARNESS=${realpathSync(root)}\n`));
  assert.ok(out.includes('# Engineering policy'));
  assert.ok(out.includes('Any change to order totals, discounts, or stock reservation is R2'));
  assert.ok(out.includes('Skill overrides present (read by each skill): review'));
  for (const p of ['dotnet-backend', 'angular', 'dotnet-angular']) assert.ok(out.includes(`read \`$HARNESS/profiles/${p}/PROFILE.md\``), p);
  assert.ok(out.includes('gotchas/dapper-varchar-parameters.md'));
  assert.ok(!out.includes('WARNING'));
});

test('eng-context finds the project from a subdirectory', () => {
  const { out } = run('bin/eng-context', [join(example, 'src/Orders.Api')]);
  assert.ok(out.includes(`Project: \`${realpathSync(example)}\``));
});

test('eng-context stays minimal in a repository that has not adopted the harness', () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'eng-plain-')));
  const { code, out } = run('bin/eng-context', ['--check', dir]);
  assert.equal(code, 0);
  assert.ok(out.includes('has not adopted the harness'));
  assert.ok(!out.includes('# Engineering policy'));
});

test('eng-context warns when the project is on an older harness line', () => {
  const dir = project({ yaml: 'harness: "0.0"\nprofiles: [dotnet-angular]\nadr_dir: docs/adr\n' });
  const { code, out } = run('bin/eng-context', ['--check', dir]);
  assert.equal(code, 1);
  assert.ok(out.includes(`project was adopted against harness 0.0; installed harness is ${version}`));
});

test('eng-context warns when the project expects a newer harness', () => {
  const dir = project({ yaml: 'harness: "99.0"\nprofiles: []\n' });
  const { out } = run('bin/eng-context', [dir]);
  assert.ok(out.includes('project expects harness 99; installed harness is'));
});

test('eng-context reports unknown profiles, stray keys, and overrides for missing skills', () => {
  const dir = project({
    yaml: `harness: "${line}"\nprofiles: [dotnet-angular, cobol]\nproject:\n  profile: x\n`,
    overrides: { 'create-controller': '- something\n' },
  });
  const { code, out } = run('bin/eng-context', ['--check', dir]);
  assert.equal(code, 1);
  assert.ok(out.includes('profile `cobol` does not exist'));
  assert.ok(out.includes('unsupported lines'));
  assert.ok(out.includes('override `create-controller.md` does not match any harness skill'));
});

test('eng-context bounds the memory index', () => {
  const memory = ['# Project memory', ...Array.from({ length: 100 }, (_, i) => `- entry ${i}`)].join('\n') + '\n';
  const { out } = run('bin/eng-context', [project({ memory })]);
  assert.ok(out.includes('- entry 58'));
  assert.ok(!out.includes('- entry 59\n'));
  assert.ok(out.includes('[truncated: 60 of 101 lines shown'));
});

test('stack-report inventories the example offline', () => {
  const { code, out } = run('bin/stack-report', ['--offline', example]);
  assert.equal(code, 0, out);
  assert.ok(out.includes('- Mode: offline'));
  assert.ok(out.includes('- global.json SDK: `10.0.100` (rollForward: `latestFeature`)'));
  assert.ok(out.includes('| `src/Orders.Api/Orders.Api.csproj` | net10.0 |'));
  assert.ok(out.includes('- @angular/core: `^21.0.0`'));
  assert.ok(out.includes('- Test builder: `@angular/build:unit-test`'));
  assert.ok(out.includes('| `Dockerfile` | `mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled` | tag only; pin a digest for production |'));
  assert.ok(out.includes('.github/workflows/ci.yml:19:      - uses: actions/setup-node@v7'));
  assert.ok(!out.includes('actions/checkout@3d3c42e5'), 'SHA-pinned actions are not reported');
  assert.ok(out.includes('Detected but not covered by Dependabot: docker'));
  assert.ok(!out.includes('### NuGet'), 'offline mode must not query registries');
});

test('eng-context parses CRLF, BOM, trailing comments, single quotes, and full versions', () => {
  const dir = project({ yaml: `\uFEFFharness: "${line}"   # adopted line\r\nprofiles: ['dotnet-angular']\r\n` });
  const { code, out } = run('bin/eng-context', ['--check', dir]);
  assert.equal(code, 0, out);
  assert.ok(out.includes(`Declared harness line: \`${line}\`. Profiles: \`dotnet-angular\`.`));

  const full = project({ yaml: `harness: ${version}\nprofiles: []\n` });
  const second = run('bin/eng-context', ['--check', full]);
  assert.equal(second.code, 0, second.out);
});

test('eng-context resolves the harness through a symlink', () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'eng-link-')));
  symlinkSync(join(root, 'bin/eng-context'), join(dir, 'eng-context'));
  const result = spawnSync(join(dir, 'eng-context'), [dir], { encoding: 'utf8' });
  assert.ok(result.stdout.startsWith(`# Engineering harness ${version}\n`));
});

test('stack-report handles spaces, quoted SHAs, Renovate, and sibling package.json files', () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'eng-stack-')));
  const write = (rel, text) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  write('.github/workflows/my ci.yml', 'permissions: {}\njobs:\n  a:\n    steps:\n      - uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1"\n      - uses: actions/cache@v4\n');
  write('renovate.json', '{}\n');
  write('e2e/package.json', '{"devDependencies":{"playwright":"1"}}\n');
  write('web/package.json', '{"dependencies":{"@angular/core":"^21.0.0"}}\n');
  write('src/My Api/My Api.csproj', '<Project><PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup></Project>\n');

  const { code, out } = run('bin/stack-report', ['--offline', dir]);
  assert.equal(code, 0, out);
  assert.ok(out.includes('| `src/My Api/My Api.csproj` | net8.0 |'));
  assert.ok(out.includes('- @angular/core: `^21.0.0`'));
  assert.ok(out.includes('.github/workflows/my ci.yml:6:      - uses: actions/cache@v4'));
  assert.ok(!out.includes('actions/checkout@3d3c'), 'quoted SHA pins are not reported');
  assert.ok(out.includes('Renovate configured.'));
});

test('check-commit-msg enforces the header format and the attribution rule', () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'eng-commit-')));
  const check = (message, ...flags) => {
    writeFileSync(join(dir, 'msg'), message);
    return run('bin/check-commit-msg', [...flags, join(dir, 'msg')]).code;
  };
  assert.equal(check('feat(api): add export\n'), 0);
  assert.equal(check('feat!: drop the v1 endpoints\n'), 0);
  assert.equal(check('add export\n'), 1);
  assert.equal(check('feature: add export\n'), 1);
  assert.equal(check(`fix: ${'x'.repeat(100)}\n`), 1);
  assert.equal(check('fix: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n'), 1);
  assert.equal(check('fix: x\n\nGenerated with Claude Code\n'), 1);
  assert.equal(check('fix: x\n\nCo-Authored-By: Ana <ana@example.com>\n'), 0);
  assert.equal(check('chore: x\n\nGenerated by the main maintenance script\n'), 0);
  assert.equal(check('Merge branch main\n'), 0);
  assert.equal(check('fix: x\n\nwhy it changed\n', '--summary-only'), 1);
  assert.equal(check('# comment\nfix: x\n# comment\n', '--summary-only'), 0);
});
