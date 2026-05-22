import { describe, expect, it } from "vitest";
import CryptoJS from "crypto-js";

import { SilentShieldCodec } from "../security";
import type { PlainCardData, SecureCardPayload } from "../types";

const SHIELD_KEY = "mbc-silent-shield-v2-demo-key";

function checksum(value: string) {
  return CryptoJS.SHA256(`${value}.${SHIELD_KEY}`).toString(CryptoJS.enc.Hex);
}

function legacyObfuscate(value: string) {
  return Array.from(value)
    .map((char, index) => {
      const keyCode = SHIELD_KEY.charCodeAt(index % SHIELD_KEY.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyCode);
    })
    .join("");
}

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

    expect(payload).toMatchObject({ v: 3 });
    if (!("v" in payload)) {
      throw new Error("Expected compact payload");
    }

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

  it("restores compact logs with fallback notes", () => {
    const codec = new SilentShieldCodec();
    const decoded = codec.decode(
      codec.encode({
        ...card,
        logs: [
          { type: "REGISTER", amount: 50_000, timestamp: 1_000, note: "custom" },
          { type: "TOPUP", amount: 25_000, timestamp: 2_000, note: "custom" },
          { type: "CHECKIN", amount: 0, timestamp: 3_000, note: "custom" },
          { type: "CHECKOUT", amount: 2_000, timestamp: 4_000, note: "custom" },
          { type: "RESET", amount: 0, timestamp: 5_000, note: "custom" },
        ],
      }),
    );

    expect(decoded.logs.map((log) => log.note)).toEqual([
      "Kartu anggota dibuat",
      "Saldo kartu ditambahkan",
      "Anggota check-in di pintu masuk",
      "Anggota check-out di pintu keluar",
      "Status kunjungan direset oleh admin",
    ]);
  });

  it("decodes legacy AES version 2 payloads", () => {
    const encodedData = CryptoJS.AES.encrypt(JSON.stringify(card), SHIELD_KEY).toString();

    expect(
      new SilentShieldCodec().decode({
        version: 2,
        encodedData,
        checksum: checksum(encodedData),
        algorithm: "AES",
      }),
    ).toEqual(card);
  });

  it("decodes legacy obfuscated version 1 payloads", () => {
    const encodedData = Buffer.from(
      legacyObfuscate(JSON.stringify(card)),
      "binary",
    ).toString("base64");

    expect(
      new SilentShieldCodec().decode({
        version: 1,
        encodedData,
        checksum: checksum(encodedData),
      }),
    ).toEqual(card);
  });

  it("rejects unsupported and undecryptable legacy payloads", () => {
    const codec = new SilentShieldCodec();
    const encodedData = CryptoJS.AES.encrypt(JSON.stringify(card), "wrong-key").toString();

    expect(() => codec.decode({} as SecureCardPayload)).toThrow("Versi kartu");
    expect(() =>
      codec.decode({
        version: 2,
        encodedData,
        checksum: checksum(encodedData),
        algorithm: "AES",
      }),
    ).toThrow();
  });
});
