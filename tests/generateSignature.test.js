import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateSignature, setRuntimeConfig } from "../mcp-server.js";

describe("generateSignature", () => {
  it("should throw an error when apiKeySecret is missing", () => {
    setRuntimeConfig({ apiKey: null });

    assert.throws(
      () => generateSignature({ test: "payload" }),
      /API key secret is missing or invalid\./,
    );
  });
});
