import { afterEach, expect, it } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { executablePath, writeExecutable } from "../executable.test-helper.ts";
import { runFixture } from "../subprocess.test-helper.ts";
import { DeadlineExceeded, WatchDeadline } from "./deadline.ts";
import { runJson } from "./github.ts";

const directories: string[] = [];
afterEach(() => {
  for (const dir of directories.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

async function run(scenario: string, extra: string[] = [], path?: string) {
  const dir = mkdtempSync(join(tmpdir(), "watch-transport-"));
  directories.push(dir);
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const gh = join(bin, "gh");
  writeExecutable(
    gh,
    `import { appendFileSync } from 'node:fs';
const args = process.argv.slice(2);
const scenario = process.env.WATCH_FIXTURE;
appendFileSync(process.env.WATCH_CALLS, JSON.stringify(args) + '\\n');
if (scenario === 'slow') {
  await new Promise(resolve => setTimeout(resolve, 2000));
}
const noCi = scenario.startsWith('no-ci');
const fail = (stderr) => { console.error(stderr); process.exit(1); };
let value;
if (args.some(a => a.includes('query PullRequestFacts'))) {
  value = { data: { repository: { pullRequest: { headRefOid: 'head', baseRef: { target: { oid: 'base' } }, mergeable: 'MERGEABLE', mergeStateStatus: scenario === 'no-ci-blocked' ? 'BLOCKED' : 'CLEAN', reviewDecision: noCi ? null : 'APPROVED', headRefName: 'feature', baseRefName: 'main', state: 'OPEN', mergedAt: null, isDraft: false } } } };
} else if (args[0] === 'pr' && args[1] === 'checks') {
  if (scenario === 'no-ci-unauthorized') fail('HTTP 401: Bad credentials (https://api.github.com/graphql)');
  if (noCi) fail("no checks reported on the 'feature' branch");
  value = [{ name: 'ci', state: 'SUCCESS', bucket: 'pass', description: '', link: '', workflow: '' }];
} else if (args.some(a => a.includes('query PrCheckRollup'))) {
  if (scenario === 'no-ci-rollup-fails') fail('HTTP 502: Bad Gateway (https://api.github.com/graphql)');
  value = { data: { repository: { pullRequest: { commits: { nodes: [{ commit: { statusCheckRollup: null } }] } } } } };
} else if (noCi && args.some(a => a.includes('query PrCommitStatuses'))) {
  value = { data: { repository: { pullRequest: { commits: { nodes: [{ commit: { oid: 'head', statusCheckRollup: null } }] } } } } };
} else if (args[0] === 'pr' && args[1] === 'list') {
  value = [{ number: 1, headRefName: 'main', baseRefName: 'main', headRepository: { name: 'repo', nameWithOwner: 'fork/repo' }, headRepositoryOwner: { login: 'fork' } }];
} else if (args[0] === 'repo' && args[1] === 'view') {
  value = { defaultBranchRef: { name: 'main' } };
} else if (args.some(a => a.includes('query ReviewThreads'))) {
  const after = args.find(a => a.startsWith('after='));
  const thread = (n, resolved) => ({ id: 't' + n, isResolved: resolved, comments: { nodes: [] } });
  const paginated = scenario === 'threads' || scenario === 'stuck-cursor';
  value = { data: { repository: { pullRequest: { reviewThreads: {
    nodes: paginated ? (after ? [thread(100, false)] : Array.from({length: 100}, (_, n) => thread(n, true))) : [],
    pageInfo: { hasNextPage: paginated && (!after || scenario === 'stuck-cursor'), endCursor: paginated ? 'next' : null }
  } } } } };
} else if (args.some(a => a.includes('query PrCommitStatuses'))) {
  value = { data: { repository: { pullRequest: { commits: { nodes: [{ commit: { oid: 'head', statusCheckRollup: { state: 'SUCCESS' } } }] } } } } };
} else { throw new Error('unexpected fixture command: ' + JSON.stringify(args)); }
console.log(JSON.stringify(value));
`
  );
  const entry = join(dir, "entry.ts");
  writeFileSync(
    entry,
    `import { main } from ${JSON.stringify(join(import.meta.dir, "cli.ts"))}; process.exitCode = await main(process.argv.slice(2));\n`
  );
  const callsFile = join(dir, "calls.jsonl");
  writeFileSync(callsFile, "");
  const started = performance.now();
  const result = await runFixture(
    [
      process.execPath,
      entry,
      "--owner", "owner", "--repo", "repo", "--pr", "1",
      ...extra,
    ],
    {
      timeout: 6000,
      env: {
        ...process.env,
        PATH: path ?? `${bin}${delimiter}${process.env.PATH}`,
        WATCH_FIXTURE: scenario,
        WATCH_CALLS: callsFile,
      },
    }
  );
  return {
    ...result,
    elapsed: performance.now() - started,
    calls: readFileSync(callsFile, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as string[]),
  };
}

it("reads page two before reporting unresolved review threads", async () => {
  const result = await run("threads");
  expect(result.status).toBe(3);
  expect(JSON.parse(result.stdout.trim())).toMatchObject({
    kind: "BLOCKER",
    blocker: { kind: "review-threads", threads: [{ id: "t100" }] },
  });
  expect(
    result.calls.filter((args) => args.includes("after=next"))
  ).toHaveLength(1);
});

it("rejects a repeating page cursor instead of looping or silently truncating", async () => {
  const result = await run("stuck-cursor", ["--max-query-errors", "1"]);
  expect(result.status).toBe(7);
  expect(
    result.calls.filter((args) =>
      args.some((arg) => arg.includes("ReviewThreads"))
    )
  ).toHaveLength(2);
});

it("keeps a fork main branch distinct from destination main during stack discovery", async () => {
  const result = await run("fork", ["--stack", "--status-only"]);
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout.trim())).toMatchObject({
    kind: "STATUS",
    rows: [{ context: { number: 1 } }],
  });
});

const verdicts = (stdout: string): unknown[] =>
  stdout
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as unknown);

// The no-ci fixtures replay what gh returned for a mergeable PR in a repository
// with no checks configured: `gh pr checks` exits 1 with "no checks reported"
// and the head commit's statusCheckRollup is null.
it("reports a first sighting of no checks on a status-only pass", async () => {
  const result = await run("no-ci", ["--status-only", "--max-query-errors", "1"]);
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout.trim())).toMatchObject({
    kind: "STATUS",
    terminal: true,
    rows: [{ kind: "open", ci: { kind: "ci-unreported" } }],
  });
});

// Confirming no checks takes 60 seconds of wall time, so a test on the real
// clock can only show the wait. A loaded machine fits fewer polls into the
// deadline, so this asserts what each poll said and not how many there were.
it("keeps a PR with no checks waiting through short-interval polls until the deadline", async () => {
  for (const scenario of ["no-ci", "no-ci-blocked"]) {
    const result = await run(scenario, [
      "--max-query-errors",
      "1",
      "--interval",
      "0.05",
      "--timeout",
      "2",
    ]);
    expect(result.status).toBe(5);
    const emitted = verdicts(result.stdout);
    for (const wait of emitted.slice(0, -1))
      expect(wait).toMatchObject({
        kind: "WAITING",
        reason: { kind: "checks-unreported" },
      });
    expect(emitted.at(-1)).toMatchObject({ kind: "TIMEOUT" });
  }
});

it("fails closed when the check queries fail instead of reporting no checks", async () => {
  for (const scenario of ["no-ci-unauthorized", "no-ci-rollup-fails"]) {
    const result = await run(scenario, ["--status-only", "--max-query-errors", "1"]);
    expect(result.status).toBe(7);
    expect(JSON.parse(result.stdout.trim())).toMatchObject({
      kind: "BLOCKER",
      blocker: { kind: "status-query" },
    });
  }
});

it("exits 7 with a JSON verdict when gh is not on PATH", async () => {
  const result = await run("missing-gh", [], "/nonexistent");
  expect(result.status).toBe(7);
  expect(JSON.parse(result.stdout.trim())).toMatchObject({
    kind: "BLOCKER",
    exitCode: 7,
    blocker: {
      kind: "status-query",
      failures: 1,
      failure: { kind: "spawn-failed", retryable: false },
    },
  });
});

it("honours a short CLI deadline including command startup", async () => {
  const result = await run("slow", ["--timeout", "0.25"]);
  expect(result.status).toBe(5);
  expect(result.elapsed).toBeLessThan(1500);
  expect(JSON.parse(result.stdout.trim())).toMatchObject({ kind: "TIMEOUT" });
});

it("kills a running command at the deadline even when it ignores SIGTERM", async () => {
  const dir = mkdtempSync(join(tmpdir(), "watch-cancellation-"));
  directories.push(dir);
  const pidFile = join(dir, "pid");
  const command = join(dir, "slow");
  writeExecutable(
    command,
    `import { writeFileSync } from 'node:fs';
process.on('SIGTERM', () => {});
await new Promise(resolve => setTimeout(resolve, 350));
writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));
await new Promise(resolve => setTimeout(resolve, 30_000));
console.log('{}');
`
  );

  // Pause this test's clock until the fixture is ready. CLI startup remains
  // covered above; this test must reach a running child before expiring it.
  let readyAt: number | undefined;
  const deadline = new WatchDeadline(0.25, () => {
    if (!existsSync(pidFile)) return 0;
    readyAt ??= performance.now();
    return (performance.now() - readyAt) / 1000;
  });
  try {
    await expect(
      runJson([executablePath(command)], deadline)
    ).rejects.toBeInstanceOf(DeadlineExceeded);
    expect(readyAt).toBeDefined();
    if (readyAt !== undefined)
      expect(performance.now() - readyAt).toBeLessThan(1500);
    const pid = Number(readFileSync(pidFile, "utf8"));
    expect(() => process.kill(pid, 0)).toThrow();
  } finally {
    if (existsSync(pidFile)) {
      const pid = Number(readFileSync(pidFile, "utf8"));
      try {
        process.kill(pid, "SIGKILL");
      } catch {}
    }
  }
});
