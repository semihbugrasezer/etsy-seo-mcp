import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";

// Try standard export mocking - providing both default and namedExports as expected by Node
const mockOpen = mock.fn();
mock.module("open", {
  defaultExport: mockOpen,
});

const { openUrlInBrowser } = await import("../mcp-server.js?" + Math.random());

describe("openUrlInBrowser", () => {
  const originalEnv = process.env.SEERXO_DISABLE_BROWSER;

  afterEach(() => {
    mockOpen.mock.resetCalls();
    mock.restoreAll();
    if (originalEnv === undefined) {
      delete process.env.SEERXO_DISABLE_BROWSER;
    } else {
      process.env.SEERXO_DISABLE_BROWSER = originalEnv;
    }
  });

  it("bypasses opening browser when SEERXO_DISABLE_BROWSER=1", () => {
    process.env.SEERXO_DISABLE_BROWSER = "1";

    openUrlInBrowser("http://example.com");
    assert.strictEqual(mockOpen.mock.calls.length, 0);
  });

  it("logs error when open() throws synchronously", () => {
    delete process.env.SEERXO_DISABLE_BROWSER;

    const consoleErrorMock = mock.method(console, "error", () => {});
    mockOpen.mock.mockImplementation(() => {
      throw new Error("sync fail");
    });

    openUrlInBrowser("http://example.com");

    assert.strictEqual(consoleErrorMock.mock.calls.length, 1);
    const logMessage = consoleErrorMock.mock.calls[0].arguments[0];
    assert.match(logMessage, /Failed to invoke browser opener: sync fail/);
  });

  it("logs error when open() rejects asynchronously", async () => {
    delete process.env.SEERXO_DISABLE_BROWSER;

    const consoleErrorMock = mock.method(console, "error", () => {});
    let rejectPromise;
    const promise = new Promise((_, reject) => {
      rejectPromise = reject;
    });
    // catch early to prevent unhandled rejection crashes
    promise.catch(() => {});

    mockOpen.mock.mockImplementation(() => {
      // Return a fresh promise so we can reject it
      return new Promise((resolve, reject) => {
        rejectPromise = reject;
      });
    });

    openUrlInBrowser("http://example.com");

    rejectPromise(new Error("async fail"));

    // Wait for the microtask queue to empty so the .catch callback runs
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.strictEqual(consoleErrorMock.mock.calls.length, 1);
    const logMessage = consoleErrorMock.mock.calls[0].arguments[0];
    assert.match(
      logMessage,
      /Failed to open browser automatically: async fail/,
    );
  });
});
