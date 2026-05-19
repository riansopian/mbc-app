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
      data: string;
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

    await reader.write({
      records: [
        {
          recordType: "mime",
          mediaType: MBC_MIME_TYPE,
          data: payload,
        },
      ],
    });
  }

  async clear(): Promise<void> {
    assertWebNfcSupport();

    const Reader = window.NDEFReader;
    if (!Reader) {
      throw new Error("Web NFC tidak tersedia.");
    }
    const reader = new Reader();

    await reader.write({
      records: [
        {
          recordType: "mime",
          mediaType: MBC_MIME_TYPE,
          data: "",
        },
      ],
    });
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
