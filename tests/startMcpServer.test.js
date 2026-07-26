import { describe, it, afterEach, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { startMcpServer, setRuntimeConfig } from "../mcp-server.js";

describe("startMcpServer", () => {
  let originalStdin;
  let originalExitCode;
  let mockStdin;

  beforeEach(() => {
    originalStdin = Object.getOwnPropertyDescriptor(process, "stdin");
    originalExitCode = process.exitCode;
    process.exitCode = undefined;

    mockStdin = new EventEmitter();
    mockStdin.setEncoding = mock.fn();

    Object.defineProperty(process, "stdin", {
      value: mockStdin,
      configurable: true,
    });

    mock.method(console, "error", () => {});
    mock.method(console, "log", () => {});
    mock.method(process, "on", () => {});
  });

  afterEach(() => {
    mock.restoreAll();
    if (originalStdin) {
      Object.defineProperty(process, "stdin", originalStdin);
    } else {
      delete process.stdin;
    }
    process.exitCode = originalExitCode;
    setRuntimeConfig({ email: null, apiKey: null });
  });

  it("fails and exits if credentials are missing", () => {
    setRuntimeConfig({ email: null, apiKey: null });
    startMcpServer();

    assert.strictEqual(process.exitCode, 1);
    assert.strictEqual(console.error.mock.callCount(), 1);
    assert.ok(
      console.error.mock.calls[0].arguments[0].includes("Missing credentials"),
    );
  });

  it("starts successfully and registers listeners when credentials are valid", () => {
    setRuntimeConfig({
      email: "test@example.com",
      apiKey: "valid-key.12345678901234567890",
    });

    startMcpServer();

    assert.strictEqual(process.exitCode, undefined);
    assert.strictEqual(console.error.mock.calls.length, 1);
    assert.ok(
      console.error.mock.calls[0].arguments[0].includes(
        "Seerxo MCP Server started",
      ),
    );

    assert.strictEqual(mockStdin.setEncoding.mock.callCount(), 1);
    assert.strictEqual(
      mockStdin.setEncoding.mock.calls[0].arguments[0],
      "utf8",
    );

    assert.strictEqual(mockStdin.listenerCount("data"), 1);
    assert.strictEqual(mockStdin.listenerCount("end"), 1);

    // Check if uncaughtException is registered on process
    const processOnCalls = process.on.mock.calls.filter(
      (c) => c.arguments[0] === "uncaughtException",
    );
    assert.strictEqual(processOnCalls.length, 1);
  });

  it("processes incoming data chunks correctly", async () => {
    setRuntimeConfig({
      email: "test@example.com",
      apiKey: "valid-key.12345678901234567890",
    });
    startMcpServer();

    // Send split chunks
    mockStdin.emit("data", '{"jsonrpc": "2.0", "id": 1, "method": "test"}');
    mockStdin.emit("data", "\n");

    // We mock console.log to verify processMcpMessage response
    // Wait for the async processing to finish
    await new Promise((resolve) => setTimeout(resolve, 50));

    // processMcpMessage doesn't write anything to stdout/console for methods not recognized,
    // so we'll just check if it buffers lines correctly by sending a tool list request
    mockStdin.emit(
      "data",
      '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}\n',
    );
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(console.log.mock.callCount() > 0);

    const loggedOutput = console.log.mock.calls[0].arguments[0];
    const parsed = JSON.parse(loggedOutput);
    assert.strictEqual(parsed.id, 2);
    assert.ok(parsed.result.tools);
  });

  it("handles uncaught exceptions", () => {
    setRuntimeConfig({
      email: "test@example.com",
      apiKey: "valid-key.12345678901234567890",
    });
    startMcpServer();

    const processOnCalls = process.on.mock.calls.filter(
      (c) => c.arguments[0] === "uncaughtException",
    );
    const uncaughtExceptionHandler = processOnCalls[0].arguments[1];

    const fakeError = new Error("Test Error");
    uncaughtExceptionHandler(fakeError);

    assert.strictEqual(process.exitCode, 1);

    const errorLogs = console.error.mock.calls.filter((c) =>
      c.arguments[0].includes("Uncaught error"),
    );
    assert.strictEqual(errorLogs.length, 1);
    assert.strictEqual(errorLogs[0].arguments[1], fakeError);
  });
});
