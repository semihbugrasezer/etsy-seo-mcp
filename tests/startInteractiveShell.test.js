import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import readline from "node:readline/promises";
import {
  startInteractiveShell,
  initConfig,
  setRuntimeConfig,
} from "../mcp-server.js";
import chalk from "chalk";

describe("startInteractiveShell", () => {
  let originalCreateInterface;
  let originalConsoleLog;
  let originalConsoleError;
  let originalStdoutWrite;
  let originalIsTTY;

  let logs = [];
  let errors = [];
  let writes = [];

  beforeEach(async () => {
    // Reset global state
    await initConfig();
    setRuntimeConfig({
      email: "test@example.com",
      apiKey: "test.1234567890123456",
      host: "http://localhost",
    });

    logs = [];
    errors = [];
    writes = [];

    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalStdoutWrite = process.stdout.write;
    originalCreateInterface = readline.createInterface;
    originalIsTTY = process.stdout.isTTY;

    console.log = (...args) => logs.push(args.join(" "));
    console.error = (...args) => errors.push(args.join(" "));
    process.stdout.write = (chunk) => {
      writes.push(chunk.toString());
      return true;
    };
    process.stdout.isTTY = true;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.stdout.write = originalStdoutWrite;
    process.stdout.isTTY = originalIsTTY;
    readline.createInterface = originalCreateInterface;
  });

  const setupMockReadline = (inputs) => {
    let callCount = 0;
    const mockRl = {
      question: async (query) => {
        if (callCount < inputs.length) {
          return inputs[callCount++];
        }
        return "quit"; // Default to quit to avoid infinite loop
      },
      close: () => {
        mockRl.closed = true;
      },
      closed: false,
    };

    readline.createInterface = () => mockRl;
    return mockRl;
  };

  it("shows help menu and exits on quit", async () => {
    setupMockReadline(["help", "quit"]);

    await startInteractiveShell();

    const allLogs = logs.join("\\n");
    assert.match(allLogs, /Commands/);
    assert.match(allLogs, /Bye 👋/);
  });

  it("advises using flags for analyze command and exits on exit", async () => {
    setupMockReadline(["analyze", "exit"]);

    await startInteractiveShell();

    const allLogs = logs.join("\\n");
    assert.match(
      allLogs,
      /takes flags, so run it from your shell instead of this prompt/,
    );
    assert.match(allLogs, /Bye 👋/);
  });

  it("handles empty input and continues", async () => {
    setupMockReadline(["", "quit"]);

    await startInteractiveShell();

    const allLogs = logs.join("\\n");
    assert.match(allLogs, /Bye 👋/);
  });

  it("handles clear command", async () => {
    setupMockReadline(["clear", "quit"]);

    await startInteractiveShell();

    const allLogs = logs.join("\\n");
    assert.match(allLogs, /Bye 👋/);

    // clear outputs escape sequences via process.stdout.write
    const allWrites = writes.join("");
    assert.ok(allWrites.includes("\x1bc"));
  });
});
