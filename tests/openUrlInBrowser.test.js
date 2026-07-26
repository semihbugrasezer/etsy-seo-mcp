import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import esmock from "esmock";
import chalk from "chalk";

describe("openUrlInBrowser", () => {
  afterEach(() => {
    mock.restoreAll();
    delete process.env.SEERXO_DISABLE_BROWSER;
  });

  it("should not open browser if SEERXO_DISABLE_BROWSER is '1'", async () => {
    process.env.SEERXO_DISABLE_BROWSER = "1";
    const openMock = mock.fn();
    const consoleErrorMock = mock.method(console, "error");
    consoleErrorMock.mock.mockImplementation(() => {});

    const { openUrlInBrowser } = await esmock("../mcp-server.js", {
      open: openMock,
    });

    openUrlInBrowser("https://example.com");
    assert.strictEqual(openMock.mock.calls.length, 0);
    assert.strictEqual(
      consoleErrorMock.mock.calls.filter(({ arguments: [message] }) =>
        String(message).startsWith("Failed to open browser"),
      ).length,
      0,
    );
  });

  it("should catch and log error if open rejects", async () => {
    const errorMsg = "async error";
    const openMock = mock.fn(async () => {
      throw new Error(errorMsg);
    });
    const consoleErrorMock = mock.method(console, "error");
    consoleErrorMock.mock.mockImplementation(() => {});

    const { openUrlInBrowser } = await esmock("../mcp-server.js", {
      open: openMock,
    });

    openUrlInBrowser("https://example.com");

    // Give promises time to settle
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.strictEqual(openMock.mock.calls.length, 1);
    const expectedMessage = chalk.yellow(
      `Failed to open browser automatically: ${errorMsg}`,
    );
    assert.strictEqual(
      consoleErrorMock.mock.calls.filter(
        ({ arguments: [message] }) => message === expectedMessage,
      ).length,
      1,
    );
  });

  it("should catch and log error if open throws synchronously", async () => {
    const errorMsg = "sync error";
    const openMock = mock.fn(() => {
      throw new Error(errorMsg);
    });
    const consoleErrorMock = mock.method(console, "error");
    consoleErrorMock.mock.mockImplementation(() => {});

    const { openUrlInBrowser } = await esmock("../mcp-server.js", {
      open: openMock,
    });

    openUrlInBrowser("https://example.com");

    assert.strictEqual(openMock.mock.calls.length, 1);
    const expectedMessage = chalk.yellow(
      `Failed to invoke browser opener: ${errorMsg}`,
    );
    assert.strictEqual(
      consoleErrorMock.mock.calls.filter(
        ({ arguments: [message] }) => message === expectedMessage,
      ).length,
      1,
    );
  });
});
