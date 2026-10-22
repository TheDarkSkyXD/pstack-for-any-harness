import { execFile } from "node:child_process";

// Bun 1.2.11 on Windows intermittently returned truncated or invalid UTF-8 from
// spawnSync pipes in the full suite. Use asynchronous pipes for test processes,
// as the production GitHub transport does, and still assert their actual output.
export function runFixture(
  argv: readonly [string, ...string[]],
  options: {
    readonly timeout: number;
    readonly env?: NodeJS.ProcessEnv;
  }
): Promise<{
  status: number | null;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      argv[0],
      [...argv.slice(1)],
      { ...options, encoding: "utf8", killSignal: "SIGKILL" },
      (error, stdout, stderr) => {
        if (error && (error.killed || typeof error.code !== "number")) {
          reject(error);
        } else {
          resolve({ status: child.exitCode, stdout, stderr });
        }
      }
    );
  });
}
