import { describe, expect, it } from "vitest";

import { MembershipBenefitTariff } from "../tariff";

const START = 1_000_000;
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

describe("MembershipBenefitTariff", () => {
  const tariff = new MembershipBenefitTariff();

  it.each([
    ["0ms", START, 1, 2_000],
    ["1ms", START + 1, 1, 2_000],
    ["59m", START + 59 * MINUTE, 1, 2_000],
    ["59m59s", START + 59 * MINUTE + 59_000, 1, 2_000],
    ["60m", START + HOUR, 1, 2_000],
    ["60m1s", START + HOUR + 1000, 2, 4_000],
    ["61m", START + 61 * MINUTE, 2, 4_000],
    ["65m1s", START + 65 * MINUTE + 1000, 2, 4_000],
  ])("rounds up %s", (_label, end, durationHours, fee) => {
    expect(tariff.calculateFee(START, end)).toEqual({ durationHours, fee });
  });

  it("rejects invalid timestamps", () => {
    expect(() => tariff.calculateFee(Number.NaN, START)).toThrow("tidak valid");
    expect(() => tariff.calculateFee(0, START)).toThrow("check-in");
    expect(() => tariff.calculateFee(START + 1, START)).toThrow("lebih awal");
  });
});
