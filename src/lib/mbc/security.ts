import CryptoJS from "crypto-js";

import type { CardCodec, PlainCardData, SecureCardPayload } from "./types";

const SHIELD_KEY = "mbc-silent-shield-v2-demo-key";
const LOG_TYPE_CODES = {
  REGISTER: "R",
  TOPUP: "T",
  CHECKIN: "I",
  CHECKOUT: "O",
  RESET: "X",
} as const;
const LOG_CODE_TYPES = {
  R: "REGISTER",
  T: "TOPUP",
  I: "CHECKIN",
  O: "CHECKOUT",
  X: "RESET",
} as const;

type CompactLogCode = keyof typeof LOG_CODE_TYPES;
type CompactCardData = [
  string,
  string,
  number,
  0 | 1,
  number,
  number,
  number,
  string,
  Array<[CompactLogCode, number, number]>,
];

function fromBase64(value: string) {
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(value)));
  }

  return Buffer.from(value, "base64").toString("utf8");
}

function legacyObfuscate(value: string) {
  return Array.from(value)
    .map((char, index) => {
      const keyCode = SHIELD_KEY.charCodeAt(index % SHIELD_KEY.length);
      return String.fromCharCode(char.charCodeAt(0) ^ keyCode);
    })
    .join("");
}

function checksum(value: string) {
  return CryptoJS.SHA256(`${value}.${SHIELD_KEY}`).toString(CryptoJS.enc.Hex);
}

function compactChecksum(value: string) {
  return checksum(value).slice(0, 16);
}

function compactKey() {
  return CryptoJS.SHA256(SHIELD_KEY);
}

function compactIv() {
  const hash = CryptoJS.SHA256(`${SHIELD_KEY}.iv`);

  return CryptoJS.lib.WordArray.create(hash.words.slice(0, 4), 16);
}

function normalizeCard(card: PlainCardData): PlainCardData {
  return {
    ...card,
    revision: card.revision ?? 0,
    cardNonce: card.cardNonce ?? CryptoJS.lib.WordArray.random(8).toString(),
    logs: card.logs ?? [],
  };
}

function fallbackNote(type: PlainCardData["logs"][number]["type"]) {
  const notes = {
    REGISTER: "Kartu anggota dibuat",
    TOPUP: "Saldo kartu ditambahkan",
    CHECKIN: "Anggota check-in di pintu masuk",
    CHECKOUT: "Anggota check-out di pintu keluar",
    RESET: "Status kunjungan direset oleh admin",
  } satisfies Record<PlainCardData["logs"][number]["type"], string>;

  return notes[type];
}

function compactCard(card: PlainCardData): CompactCardData {
  const normalized = normalizeCard(card);

  return [
    normalized.memberId,
    normalized.name,
    normalized.balance,
    normalized.visitStatus === "IN" ? 1 : 0,
    normalized.checkInTimestamp,
    normalized.lastUpdatedAt,
    normalized.revision,
    normalized.cardNonce,
    normalized.logs.map((log) => [
      LOG_TYPE_CODES[log.type],
      log.amount,
      log.timestamp,
    ]),
  ];
}

function expandCard(compact: CompactCardData): PlainCardData {
  return normalizeCard({
    memberId: compact[0],
    name: compact[1],
    balance: compact[2],
    visitStatus: compact[3] === 1 ? "IN" : "OUT",
    checkInTimestamp: compact[4],
    lastUpdatedAt: compact[5],
    revision: compact[6],
    cardNonce: compact[7],
    logs: compact[8].map(([code, amount, timestamp]) => {
      const type = LOG_CODE_TYPES[code];

      return {
        type,
        amount,
        timestamp,
        note: fallbackNote(type),
      };
    }),
  });
}

export class SilentShieldCodec implements CardCodec {
  encode(card: PlainCardData): SecureCardPayload {
    const serialized = JSON.stringify(compactCard(card));
    const encodedData = CryptoJS.AES.encrypt(serialized, compactKey(), {
      iv: compactIv(),
    }).ciphertext.toString(CryptoJS.enc.Base64);

    return {
      v: 3,
      d: encodedData,
      c: compactChecksum(encodedData),
    };
  }

  decode(payload: SecureCardPayload): PlainCardData {
    if ("v" in payload && payload.v === 3) {
      if (compactChecksum(payload.d) !== payload.c) {
        throw new Error("Checksum kartu tidak valid. Data mungkin rusak.");
      }

      const decrypted = CryptoJS.AES.decrypt(
        CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Base64.parse(payload.d),
        }),
        compactKey(),
        { iv: compactIv() },
      ).toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        throw new Error("Payload kartu tidak dapat didekripsi.");
      }

      return expandCard(JSON.parse(decrypted) as CompactCardData);
    }

    if (!("encodedData" in payload)) {
      throw new Error("Versi kartu tidak didukung.");
    }

    if (checksum(payload.encodedData) !== payload.checksum) {
      throw new Error("Checksum kartu tidak valid. Data mungkin rusak.");
    }

    if (payload.version === 2) {
      const decrypted = CryptoJS.AES.decrypt(payload.encodedData, SHIELD_KEY).toString(
        CryptoJS.enc.Utf8,
      );

      if (!decrypted) {
        throw new Error("Payload kartu tidak dapat didekripsi.");
      }

      return normalizeCard(JSON.parse(decrypted) as PlainCardData);
    }

    if (payload.version === 1) {
      return normalizeCard(
        JSON.parse(legacyObfuscate(fromBase64(payload.encodedData))) as PlainCardData,
      );
    }

    throw new Error("Versi kartu tidak didukung.");
  }
}
