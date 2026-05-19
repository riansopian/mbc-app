import CryptoJS from "crypto-js";

import type { CardCodec, PlainCardData, SecureCardPayload } from "./types";

const SHIELD_KEY = "mbc-silent-shield-v2-demo-key";

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

function normalizeCard(card: PlainCardData): PlainCardData {
  return {
    ...card,
    revision: card.revision ?? 0,
    cardNonce: card.cardNonce ?? CryptoJS.lib.WordArray.random(8).toString(),
    logs: card.logs ?? [],
  };
}

export class SilentShieldCodec implements CardCodec {
  encode(card: PlainCardData): SecureCardPayload {
    const serialized = JSON.stringify(normalizeCard(card));
    const encodedData = CryptoJS.AES.encrypt(serialized, SHIELD_KEY).toString();

    return {
      version: 2,
      algorithm: "AES",
      encodedData,
      checksum: checksum(encodedData),
    };
  }

  decode(payload: SecureCardPayload): PlainCardData {
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
