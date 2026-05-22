import type { Clock, TariffPolicy } from "./types";

const HOUR_IN_MS = 60 * 60 * 1000;

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class MembershipBenefitTariff implements TariffPolicy {
  constructor(private readonly hourlyRate = 2000) {}

  calculateFee(checkInTimestamp: number, checkOutTimestamp: number) {
    if (!Number.isFinite(checkInTimestamp) || !Number.isFinite(checkOutTimestamp)) {
      throw new Error("Timestamp kunjungan tidak valid.");
    }

    if (checkInTimestamp <= 0) {
      throw new Error("Timestamp check-in tidak valid.");
    }

    if (checkOutTimestamp < checkInTimestamp) {
      throw new Error("Timestamp check-out tidak boleh lebih awal dari check-in.");
    }

    const elapsedMs = checkOutTimestamp - checkInTimestamp;
    const durationHours = Math.ceil(elapsedMs / HOUR_IN_MS);

    return {
      durationHours,
      fee: durationHours * this.hourlyRate,
    };
  }
}
