import type { CardCodec, CardRepository, PlainCardData, SecureCardPayload } from "./types";

const MBC_MIME_TYPE = "application/vnd.mbc.card+json";
const SCAN_TIMEOUT_MS = 15000;

type NdefRecordData = {
  recordType: string;
  mediaType?: string;
  data?: DataView;
};

type NdefReadingEvent = Event & {
  serialNumber?: string;
  message: {
    records: NdefRecordData[];
  };
};

type NdefReader = EventTarget & {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(message: {
    records: Array<{
      recordType: string;
      mediaType?: string;
      data: BufferSource;
    }>;
  }): Promise<void>;
};

export type WebNfcCardRepositoryEvents = {
  onDetected?: (serialNumber: string | null) => void;
};

declare global {
  interface Window {
    NDEFReader?: new () => NdefReader;
  }
}

function assertWebNfcSupport() {
  if (!("NDEFReader" in window) || !window.NDEFReader) {
    throw new Error(
      "Fitur NFC dari browser tidak tersedia. Gunakan Google Chrome di Android melalui HTTPS atau localhost.",
    );
  }
}

function decodeRecord(record: NdefRecordData) {
  if (!record.data) {
    return "";
  }

  const decoder = new TextDecoder();
  return decoder.decode(record.data);
}

function encodeMimePayload(value: string) {
  return new TextEncoder().encode(value);
}

function normalizeWriteError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("io error") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("failed to write")
  ) {
    return new Error(
      "Kartu NFC gagal ditulis. Tahan kartu lebih lama di area NFC HP. Jika masih gagal, kemungkinan kartu belum berformat NDEF, terkunci/read-only, atau kapasitasnya terlalu kecil. Gunakan kartu NTAG215/NTAG216 atau format kartu dengan aplikasi NFC Tools.",
    );
  }

  return error instanceof Error ? error : new Error(message);
}

function findMbcPayload(records: NdefRecordData[]) {
  const record = records.find(
    (item) =>
      (item.recordType === "mime" && item.mediaType === MBC_MIME_TYPE) ||
      item.recordType === "text",
  );

  if (!record) {
    throw new Error("Kartu NFC tidak berisi data Membership Benefit Card.");
  }

  const payload = decodeRecord(record);

  if (!payload.trim()) {
    throw new Error("Kartu NFC kosong. Daftarkan kartu melalui menu Admin Koperasi.");
  }

  return JSON.parse(payload) as SecureCardPayload;
}

export function isWebNfcSupported() {
  return typeof window !== "undefined" && "NDEFReader" in window;
}

export class WebNfcCardRepository implements CardRepository {
  private lastReadSerialNumber: string | null = null;

  constructor(
    private readonly codec: CardCodec,
    private readonly events: WebNfcCardRepositoryEvents = {},
  ) {}

  async read(): Promise<PlainCardData | null> {
    assertWebNfcSupport();

    const { payload } = await this.readSecurePayload();
    return this.codec.decode(payload);
  }

  async write(card: PlainCardData): Promise<void> {
    assertWebNfcSupport();

    const Reader = window.NDEFReader;
    if (!Reader) {
      throw new Error("Web NFC tidak tersedia.");
    }
    const reader = new Reader();
    const payload = JSON.stringify(this.codec.encode(card));

    const expectedSerialNumber = this.lastReadSerialNumber;
    if (expectedSerialNumber) {
      const { serialNumber } = await this.readSecurePayload();

      if (serialNumber && serialNumber !== expectedSerialNumber) {
        throw new Error("Kartu yang ditempel berbeda dari kartu yang dibaca sebelumnya.");
      }
    }

    try {
      await reader.write({
        records: [
          {
            recordType: "mime",
            mediaType: MBC_MIME_TYPE,
            data: encodeMimePayload(payload),
          },
        ],
      });
    } catch (error) {
      throw normalizeWriteError(error);
    }
  }

  async clear(): Promise<void> {
    assertWebNfcSupport();

    const Reader = window.NDEFReader;
    if (!Reader) {
      throw new Error("Web NFC tidak tersedia.");
    }
    const reader = new Reader();

    try {
      await reader.write({
        records: [
          {
            recordType: "mime",
            mediaType: MBC_MIME_TYPE,
            data: encodeMimePayload(""),
          },
        ],
      });
    } catch (error) {
      throw normalizeWriteError(error);
    }
  }

  async exportSecurePayload(): Promise<SecureCardPayload | null> {
    const { payload } = await this.readSecurePayload();

    return payload;
  }

  private async readSecurePayload(): Promise<{
    payload: SecureCardPayload;
    serialNumber: string | null;
  }> {
    const Reader = window.NDEFReader;
    if (!Reader) {
      throw new Error("Web NFC tidak tersedia.");
    }
    const reader = new Reader();
    const controller = new AbortController();

    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        controller.abort();
        reject(new Error("Waktu membaca NFC habis. Tempelkan kartu lebih dekat lalu coba lagi."));
      }, SCAN_TIMEOUT_MS);

      reader.addEventListener(
        "reading",
        (event) => {
          window.clearTimeout(timeoutId);

          try {
            const readingEvent = event as NdefReadingEvent;
            const serialNumber = readingEvent.serialNumber ?? null;
            this.lastReadSerialNumber = serialNumber;
            this.events.onDetected?.(serialNumber);

            resolve({
              payload: findMbcPayload(readingEvent.message.records),
              serialNumber,
            });
          } catch (error) {
            reject(error);
          } finally {
            controller.abort();
          }
        },
        { once: true },
      );

      reader.scan({ signal: controller.signal }).catch((error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
    });
  }
}
