import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  linkSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let launcher: string | undefined;
let buildDirectory: string | undefined;

process.once("exit", () => {
  if (buildDirectory) rmSync(buildDirectory, { recursive: true, force: true });
});

export function executablePath(path: string): string {
  return process.platform === "win32" ? `${path}.exe` : path;
}

// Native executables exercise PATH lookup and process cancellation on every OS.
// A shared launcher keeps the runtime build out of each individual fixture.
export function writeExecutable(path: string, source: string): void {
  if (!launcher) {
    buildDirectory ??= mkdtempSync(join(tmpdir(), "bun-fixture-launcher-"));
    const entry = join(buildDirectory, "launcher.ts");
    writeFileSync(
      entry,
      `import { pathToFileURL } from "node:url";
await import(pathToFileURL(process.execPath + ".mjs").href);
`
    );
    const output = executablePath(join(buildDirectory, "launcher"));
    const built = spawnSync(
      process.execPath,
      ["build", "--compile", entry, "--outfile", output],
      {
        cwd: buildDirectory,
        encoding: "utf8",
        timeout: 30_000,
      }
    );
    if (built.status !== 0)
      throw new Error(`fixture build failed: ${built.error ?? built.stderr}`);
    launcher = output;
  }
  const target = executablePath(path);
  try {
    linkSync(launcher, target);
  } catch {
    copyFileSync(launcher, target);
  }
  writeFileSync(`${target}.mjs`, source);
}
