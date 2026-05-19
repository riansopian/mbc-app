import { describe, expect, it } from "vitest";

import { formatCurrency, formatDateTime, toInputDateTime } from "../format";

describe("format utilities", () => {
  it("formats IDR currency without decimals", () => {
    expect(formatCurrency(50_000).replace(/\s/g, "")).toBe("Rp50.000");
  });

  it("returns fallback for empty timestamps", () => {
    expect(formatDateTime(0)).toBe("-");
  });

  it("converts timestamps to datetime-local input format", () => {
    expect(toInputDateTime(1_700_000_000_000)).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
    );
  });
});
