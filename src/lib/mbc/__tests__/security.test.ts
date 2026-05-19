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

    expect(payload.version).toBe(2);
    expect(payload.algorithm).toBe("AES");
    expect(serializedPayload).not.toContain(card.name);
    expect(serializedPayload).not.toContain(card.memberId);
    expect(serializedPayload).not.toContain(String(card.balance));
    expect(codec.decode(payload)).toEqual(card);
  });

  it("rejects tampered payloads", () => {
    const codec = new SilentShieldCodec();
    const payload = codec.encode(card);

    expect(() =>
      codec.decode({ ...payload, encodedData: `${payload.encodedData}tampered` }),
    ).toThrow("Checksum");
  });
});
