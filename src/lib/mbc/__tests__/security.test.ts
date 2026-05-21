import { describe, expect, it } from "vitest";

import { SilentShieldCodec } from "../security";
import type { PlainCardData } from "../types";

describe("SilentShieldCodec", () => {
  const card: PlainCardData = {
    memberId: "MBC001",
    name: "Anggota Koperasi",
    balance: 50_000,
    visitStatus: "OUT",
    checkInTimestamp: 0,
    lastUpdatedAt: 1_000_000,
    revision: 1,
    cardNonce: "nonce",
    logs: [],
  };

  it("encrypts card data without plaintext sensitive fields", () => {
    const codec = new SilentShieldCodec();
    const payload = codec.encode(card);
    const serializedPayload = JSON.stringify(payload);

    expect(payload).toMatchObject({ v: 3 });
    expect(serializedPayload).not.toContain(card.name);
    expect(serializedPayload).not.toContain(card.memberId);
    expect(serializedPayload).not.toContain(String(card.balance));
    expect(codec.decode(payload)).toEqual(card);
  });

  it("rejects tampered payloads", () => {
    const codec = new SilentShieldCodec();
    const payload = codec.encode(card);

    expect(() => codec.decode({ ...payload, d: `${payload.d}tampered` })).toThrow(
      "Checksum",
    );
  });

  it("keeps the encrypted payload compact enough for common NTAG215/216 cards", () => {
    const codec = new SilentShieldCodec();
    const payload = codec.encode({
      ...card,
      logs: [
        { type: "REGISTER", amount: 50_000, timestamp: 1_000, note: "Kartu anggota dibuat" },
        { type: "TOPUP", amount: 25_000, timestamp: 2_000, note: "Saldo kartu ditambahkan" },
        { type: "CHECKIN", amount: 0, timestamp: 3_000, note: "Anggota check-in di pintu masuk" },
        { type: "CHECKOUT", amount: 2_000, timestamp: 4_000, note: "Kunjungan 1 jam" },
        { type: "RESET", amount: 0, timestamp: 5_000, note: "Status kunjungan direset oleh admin" },
      ],
    });

    expect(new TextEncoder().encode(JSON.stringify(payload)).byteLength).toBeLessThan(450);
  });
});
