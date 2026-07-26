import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateSignature } from "../mcp-server.js";
import crypto from "node:crypto";

describe("generateSignature", () => {
  it("should throw an error when apiKeySecret is missing", () => {
    // We cannot easily test this if we can't reset the module-level state of apiKeySecret,
    // but we can try calling it. If it throws, it works.

    // In order to properly test this without mocking module-level variables (since they are not exported to be mutated),
    // wait, we can't just mutate apiKeySecret in tests since it's a module level variable. Let's look at how we can mock it.
    // Ah, wait, if apiKeySecret is null (which is the default), it should throw.
    assert.throws(() => {
      generateSignature({ test: "payload" });
    }, /API key secret is missing or invalid\./);
  });
});
