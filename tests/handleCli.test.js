import test from "node:test";
import assert from "node:assert";
import { handleCli } from "../mcp-server.js";

test("handleCli", async (t) => {
  let originalConsoleError;
  let originalConsoleLog;
  let originalExitCode;

  t.beforeEach(() => {
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    originalExitCode = process.exitCode;
  });

  t.afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    process.exitCode = originalExitCode;
  });

  await t.test(
    "unknown subcommand sets exitCode to 1 and prints error",
    async () => {
      const errorLogs = [];
      console.error = (...args) => errorLogs.push(args.join(" "));
      const logLogs = [];
      console.log = (...args) => logLogs.push(args.join(" "));

      // reset exitCode just in case
      process.exitCode = undefined;

      await handleCli(["nonexistent-command"]);

      assert.strictEqual(process.exitCode, 1, "process.exitCode should be 1");
      assert.strictEqual(
        errorLogs.length,
        1,
        "console.error should be called once",
      );
      assert.match(
        errorLogs[0],
        /\[seerxo\] Unknown command: nonexistent-command/,
        "should log unknown command error",
      );
      assert.ok(
        logLogs.length > 0,
        "printUsage should log something to console",
      );
      assert.match(
        logLogs[0],
        /Commands:/,
        "should print usage with Commands list",
      );
    },
  );
});
