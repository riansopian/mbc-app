import { beforeEach, describe, expect, it } from "vitest";

import { MembershipCardService } from "../service";
import { MembershipBenefitTariff } from "../tariff";
import type { CardRepository, Clock, PlainCardData, SecureCardPayload } from "../types";

class MemoryRepository implements CardRepository {
  card: PlainCardData | null = null;

  async read() {
    return this.card ? structuredClone(this.card) : null;
  }

  async write(card: PlainCardData) {
    this.card = structuredClone(card);
  }

  async clear() {
    this.card = null;
  }

  async exportSecurePayload(): Promise<SecureCardPayload | null> {
    return null;
  }
}

class MutableClock implements Clock {
  constructor(private timestamp: number) {}

  now() {
    return this.timestamp;
  }

  set(timestamp: number) {
    this.timestamp = timestamp;
  }
}

describe("MembershipCardService", () => {
  let repository: MemoryRepository;
  let clock: MutableClock;
  let service: MembershipCardService;

  beforeEach(() => {
    repository = new MemoryRepository();
    clock = new MutableClock(1_000_000);
    service = new MembershipCardService(
      repository,
      new MembershipBenefitTariff(),
      clock,
    );
  });

  it("registers, tops up, and keeps sensitive card state on card memory", async () => {
    const registered = await service.register(" MBC001 ", " Anggota ", 50_000);
    expect(registered.card.memberId).toBe("MBC001");
    expect(registered.card.name).toBe("Anggota");
    expect(registered.card.balance).toBe(50_000);
    expect(registered.card.visitStatus).toBe("OUT");

    const toppedUp = await service.topUp(25_000);
    expect(toppedUp.card.balance).toBe(75_000);
  });

  it("rejects invalid top-up and unregistered operations", async () => {
    await expect(service.topUp(0)).rejects.toThrow("Nominal isi saldo");
    await expect(service.checkIn()).rejects.toThrow("belum terdaftar");
  });

  it("prevents double check-in and double check-out", async () => {
    await service.register("MBC001", "Anggota", 50_000);
    await service.checkIn();
    await expect(service.checkIn()).rejects.toThrow("Check-in ulang");

    clock.set(1_000_000 + 65 * 60 * 1000);
    await service.checkOut();
    await expect(service.checkOut()).rejects.toThrow("belum check-in");
  });

  it("charges rounded-up member benefit tariff on checkout", async () => {
    await service.register("MBC001", "Anggota", 50_000);
    await service.checkIn(1_000_000);

    clock.set(1_000_000 + 65 * 60 * 1000 + 1000);
    const result = await service.checkOut();

    expect(result.durationHours).toBe(2);
    expect(result.fee).toBe(4_000);
    expect(result.card.balance).toBe(46_000);
  });

  it("rejects invalid and future simulation timestamps", async () => {
    await service.register("MBC001", "Anggota", 50_000);

    await expect(service.checkIn(Number.NaN)).rejects.toThrow("tidak valid");
    await expect(service.checkIn(clock.now() + 2 * 60 * 1000)).rejects.toThrow(
      "melebihi waktu saat ini",
    );
  });

  it("keeps only the latest 5 logs", async () => {
    await service.register("MBC001", "Anggota", 500_000);

    for (let index = 0; index < 8; index += 1) {
      clock.set(1_000_000 + index + 1);
      await service.topUp(10_000);
    }

    const card = await service.getCard();
    expect(card?.logs).toHaveLength(5);
    expect(card?.logs.every((log) => log.type === "TOPUP")).toBe(true);
    expect(card?.logs.map((log) => log.timestamp)).toEqual([
      1_000_008,
      1_000_007,
      1_000_006,
      1_000_005,
      1_000_004,
    ]);
  });
});
