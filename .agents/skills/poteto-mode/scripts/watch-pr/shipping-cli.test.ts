import { expect, it } from "bun:test";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { delimiter, join } from "node:path";
import { writeExecutable } from "../executable.test-helper.ts";
import { runFixture } from "../subprocess.test-helper.ts";
import { tmpdir } from "node:os";
import { object } from "./landing.ts";

async function fixture(
  body: (
    run: (...args: string[]) => Promise<{
      status: number | null;
      output: Record<string, unknown>;
    }>,
    file: string,
    dir: string
  ) => Promise<void>
) {
  const dir = mkdtempSync(join(tmpdir(), "shipping-cli-"));
  const file = join(dir, "state.json");
  writeFileSync(
    file,
    JSON.stringify({
      id: "pr-id",
      state: "OPEN",
      headRefOid: "head",
      baseRefName: "main",
      baseRefOid: "stored-base",
      baseRef: { target: { oid: "base" } },
      autoMergeRequest: { enabledAt: "now" },
      mergeQueueEntry: { id: "queue" },
      mergeCommit: null,
    })
  );
  const gh = join(dir, "gh");
  writeExecutable(
    gh,
    `import { readFileSync, writeFileSync } from 'node:fs';
import { fakeGitHub } from ${JSON.stringify(join(import.meta.dir, "shipping.test-helper.ts"))};
const state = JSON.parse(readFileSync(process.env.SHIPPING_STATE, 'utf8'));
const response = fakeGitHub(state, process.argv.slice(2));
writeFileSync(process.env.SHIPPING_STATE, JSON.stringify(state));
console.log(JSON.stringify(response));
`
  );
  const entry = join(dir, "entry.ts");
  writeFileSync(
    entry,
    `import { main } from ${JSON.stringify(join(import.meta.dir, "shipping-cli.ts"))}; process.exitCode = await main(process.argv.slice(2));`
  );
  const run = async (...args: string[]) => {
    const result = await runFixture([process.execPath, entry, ...args], {
      timeout: 3000,
      env: {
        ...process.env,
        PATH: `${dir}${delimiter}${process.env.PATH}`,
        SHIPPING_STATE: file,
      },
    });
    return {
      status: result.status,
      output: object(JSON.parse(result.stdout), "CLI result"),
    };
  };
  try {
    await body(run, file, dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

it("the CLI inspects, saves, cancels both mechanisms, and reads back in fresh processes", () =>
  fixture(async (run, file, dir) => {
    const inspected = await run("inspect", "--repo", "owner/repo", "--pr", "1");
    expect(inspected.status).toBe(0);
    expect(object(inspected.output.record, "record").revision).toEqual({
      context: { owner: "owner", repo: "repo", number: 1 },
      headRefOid: "head",
      baseRefName: "main",
      baseRefOid: "base",
    });
    const saved = join(dir, "record.json");
    writeFileSync(saved, JSON.stringify(inspected.output));
    const cancelled = await run("cancel-pending", "--record", saved);
    expect(cancelled.status).toBe(0);
    expect(cancelled.output).toMatchObject({
      kind: "cancelled",
      record: { pending: { autoMerge: false, queueEntryId: null } },
    });
    expect(JSON.parse(readFileSync(file, "utf8"))).toMatchObject({
      autoMergeRequest: null,
      mergeQueueEntry: null,
    });
  }));

it("the CLI refuses a changed base without cancelling anything", () =>
  fixture(async (run, file, dir) => {
    const inspected = await run("inspect", "--repo", "owner/repo", "--pr", "1");
    const saved = join(dir, "record.json");
    writeFileSync(saved, JSON.stringify(inspected.output));
    const changed = {
      ...JSON.parse(readFileSync(file, "utf8")),
      baseRef: { target: { oid: "advanced" } },
    };
    writeFileSync(file, JSON.stringify(changed));
    const result = await run("cancel-pending", "--record", saved);
    expect(result.status).toBe(1);
    expect(result.output.kind).toBe("changed");
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(changed);
  }));

it("the CLI treats a missing queue field as unavailable", () =>
  fixture(async (run, file) => {
    const raw = JSON.parse(readFileSync(file, "utf8"));
    delete raw.mergeQueueEntry;
    writeFileSync(file, JSON.stringify(raw));
    const result = await run("inspect", "--repo", "owner/repo", "--pr", "1");
    expect(result.status).toBe(1);
    expect(result.output.kind).toBe("unavailable");
  }));

for (const state of ["CLOSED", "MERGED"]) {
  it(`the CLI inspects a ${state} PR with a deleted base and refuses cancellation`, () =>
    fixture(async (run, file, dir) => {
      const inspected = await run("inspect", "--repo", "owner/repo", "--pr", "1");
      expect(inspected.status).toBe(0);
      const saved = join(dir, "record.json");
      writeFileSync(saved, JSON.stringify(inspected.output));
      const terminal = {
        ...JSON.parse(readFileSync(file, "utf8")),
        state,
        baseRef: null,
        autoMergeRequest: null,
        mergeQueueEntry: null,
        mergeCommit: state === "MERGED" ? { oid: "merged" } : null,
      };
      writeFileSync(file, JSON.stringify(terminal));
      const record = {
        state,
        revision: { baseRefOid: "stored-base" },
        mergeCommitOid: state === "MERGED" ? "merged" : null,
      };

      const observed = await run("inspect", "--repo", "owner/repo", "--pr", "1");
      expect(observed.status).toBe(0);
      expect(observed.output).toMatchObject({ kind: "inspected", record });
      const cancelled = await run("cancel-pending", "--record", saved);
      expect(cancelled.status).toBe(1);
      expect(cancelled.output).toMatchObject({ kind: "not-open", record });
      expect(JSON.parse(readFileSync(file, "utf8"))).toEqual(terminal);
    }));
}
