import { describe, expect, it } from "vitest";

import { generateMemberId } from "../member-id";

describe("generateMemberId", () => {
  it("creates a simple offline member ID from date and random suffix", () => {
    expect(generateMemberId(new Date("2026-05-22T04:00:00.000Z"), 0.4821)).toBe(
      "MBC-260522-4821",
    );
  });
});
