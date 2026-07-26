import { describe, it } from "node:test";
import { ok } from "node:assert";

describe("seerxo-mcp entrypoint", () => {
  it("should import without errors", async () => {
    // The entrypoint checks if (process.env.NODE_ENV !== 'test')
    // and avoids starting the server in test environments.
    // By importing it, we verify the syntax is valid and modules resolve.
    await import("../bin/seerxo-mcp.js");
    ok(true);
  });
});
