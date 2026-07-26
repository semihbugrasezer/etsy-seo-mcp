import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import readline from "node:readline/promises";
import * as mcpServer from "../mcp-server.js";

describe("startInteractiveShell", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("prints help and then exits", async () => {
    let questionCalls = 0;
    const mockRl = {
      question: async (prompt) => {
        questionCalls++;
        if (questionCalls === 1) return "n"; // For promptLoginIfNecessary
        if (questionCalls === 2) return "help";
        if (questionCalls === 3) return "exit";
      },
      close: () => {},
    };

    mock.method(readline, "createInterface", () => mockRl);

    let logOutput = "";
    mock.method(console, "log", (msg) => {
      logOutput += msg + "\n";
    });

    await mcpServer.startInteractiveShell();

    assert.match(logOutput, /Commands/);
    assert.match(logOutput, /Bye/);
  });

  it("handles clear command", async () => {
    let questionCalls = 0;
    const mockRl = {
      question: async (prompt) => {
        questionCalls++;
        if (questionCalls === 1) return "n"; // For promptLoginIfNecessary
        if (questionCalls === 2) return "clear";
        if (questionCalls === 3) return "exit";
      },
      close: () => {},
    };

    mock.method(readline, "createInterface", () => mockRl);

    let logOutput = "";
    mock.method(console, "log", (msg) => {
      logOutput += msg + "\n";
    });

    await mcpServer.startInteractiveShell();

    assert.match(logOutput, /Bye/);
  });

  it("handles empty input", async () => {
    let questionCalls = 0;
    const mockRl = {
      question: async (prompt) => {
        questionCalls++;
        if (questionCalls === 1) return "n"; // For promptLoginIfNecessary
        if (questionCalls === 2) return ""; // Empty input
        if (questionCalls === 3) return "exit";
      },
      close: () => {},
    };

    mock.method(readline, "createInterface", () => mockRl);

    let logOutput = "";
    mock.method(console, "log", (msg) => {
      logOutput += msg + "\n";
    });

    await mcpServer.startInteractiveShell();

    assert.match(logOutput, /Bye/);
  });

  it("prints command instructions for analyze/audit/optimize/keywords", async () => {
    let questionCalls = 0;
    const mockRl = {
      question: async (prompt) => {
        questionCalls++;
        if (questionCalls === 1) return "n"; // For promptLoginIfNecessary
        if (questionCalls === 2) return "analyze";
        if (questionCalls === 3) return "exit";
      },
      close: () => {},
    };

    mock.method(readline, "createInterface", () => mockRl);

    let logOutput = "";
    mock.method(console, "log", (msg) => {
      logOutput += msg + "\n";
    });

    await mcpServer.startInteractiveShell();

    assert.match(
      logOutput,
      /takes flags, so run it from your shell instead of this prompt/,
    );
    assert.match(logOutput, /Bye/);
  });
});
