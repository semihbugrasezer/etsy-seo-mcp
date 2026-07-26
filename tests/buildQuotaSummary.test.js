import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildQuotaSummary } from "../mcp-server.js";

describe("buildQuotaSummary", () => {
  it("returns unlimited credits summary when no usage data is provided", () => {
    const result = buildQuotaSummary();
    assert.deepEqual(result, {
      headline: "Unlimited credits",
      detail: "0 used",
      tone: "success",
    });
  });

  it("returns unlimited credits summary when limit is not finite", () => {
    const result = buildQuotaSummary({
      limit: "abc",
      remaining: 5,
      current: 2,
    });
    assert.deepEqual(result, {
      headline: "Unlimited credits",
      detail: "2 used",
      tone: "success",
    });
  });

  it("returns correct summary for normal quota (remaining > 2)", () => {
    const result = buildQuotaSummary({ limit: 10, remaining: 5, current: 5 });
    assert.deepEqual(result, {
      headline: "5 credits left",
      detail: "5/10 used",
      tone: "info",
    });
  });

  it("returns warning summary for low quota (remaining = 2)", () => {
    const result = buildQuotaSummary({ limit: 10, remaining: 2, current: 8 });
    assert.deepEqual(result, {
      headline: "2 credits left",
      detail: "8/10 used",
      tone: "warning",
    });
  });

  it("returns warning summary for low quota (remaining = 1)", () => {
    const result = buildQuotaSummary({ limit: 10, remaining: 1, current: 9 });
    assert.deepEqual(result, {
      headline: "1 credit left",
      detail: "9/10 used",
      tone: "warning",
    });
  });

  it("returns danger summary for depleted quota (remaining = 0)", () => {
    const result = buildQuotaSummary({ limit: 10, remaining: 0, current: 10 });
    assert.deepEqual(result, {
      headline: "No credits left",
      detail: "10/10 used",
      tone: "danger",
    });
  });

  it("uses usage.used if usage.current is not provided", () => {
    const result = buildQuotaSummary({ limit: 10, remaining: 3, used: 7 });
    assert.deepEqual(result, {
      headline: "3 credits left",
      detail: "7/10 used",
      tone: "info",
    });
  });

  it("calculates current used if neither current nor used are provided", () => {
    const result = buildQuotaSummary({ limit: 10, remaining: 4 });
    assert.deepEqual(result, {
      headline: "4 credits left",
      detail: "6/10 used",
      tone: "info",
    });
  });

  it("caps negative remaining at 0", () => {
    const result = buildQuotaSummary({ limit: 10, remaining: -5, current: 15 });
    assert.deepEqual(result, {
      headline: "No credits left",
      detail: "15/10 used",
      tone: "danger",
    });
  });

  it("caps negative current/used at 0", () => {
    const result = buildQuotaSummary({ limit: 10, remaining: 10, current: -5 });
    assert.deepEqual(result, {
      headline: "10 credits left",
      detail: "0/10 used",
      tone: "info",
    });
  });

  it("caps calculated current at 0 if limit - remaining < 0", () => {
    const result = buildQuotaSummary({ limit: 10, remaining: 15 });
    assert.deepEqual(result, {
      headline: "15 credits left",
      detail: "0/10 used",
      tone: "info",
    });
  });
});
