// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { SilentShieldCodec } from "../security";
import { WebNfcCardRepository } from "../web-nfc";

type MockRecord = {
  recordType: string;
  mediaType?: string;
  data?: DataView;
};

const MBC_MIME_TYPE = "application/vnd.mbc.card+json";

function toDataView(value: string) {
  const bytes = new TextEncoder().encode(value);

  return new DataView(bytes.buffer);
}

function installReader(records: MockRecord[], serialNumber = "04-TEST") {
  class MockNdefReader extends EventTarget {
    async scan() {
      queueMicrotask(() => {
        this.dispatchEvent(
          Object.assign(new Event("reading"), {
            serialNumber,
            message: { records },
          }),
        );
      });
    }

    async write() {}
  }

  Object.defineProperty(window, "NDEFReader", {
    configurable: true,
    value: MockNdefReader,
  });
}

function removeReader() {
  Object.defineProperty(window, "NDEFReader", {
    configurable: true,
    value: undefined,
  });
}

describe("WebNfcCardRepository", () => {
  afterEach(() => {
    vi.useRealTimers();
    removeReader();
  });

  it("rejects unsupported browsers", async () => {
    removeReader();

    await expect(
      new WebNfcCardRepository(new SilentShieldCodec()).read(),
    ).rejects.toThrow("Fitur NFC dari browser tidak tersedia");
  });

  it("rejects scan timeout", async () => {
    vi.useFakeTimers();

    class IdleNdefReader extends EventTarget {
      async scan() {}
      async write() {}
    }

    Object.defineProperty(window, "NDEFReader", {
      configurable: true,
      value: IdleNdefReader,
    });

    const readPromise = new WebNfcCardRepository(new SilentShieldCodec()).read();
    const assertion = expect(readPromise).rejects.toThrow("Waktu membaca NFC habis");
    await vi.advanceTimersByTimeAsync(15_000);

    await assertion;
  });

  it("rejects empty cards", async () => {
    installReader([
      {
        recordType: "mime",
        mediaType: MBC_MIME_TYPE,
        data: toDataView(""),
      },
    ]);

    await expect(
      new WebNfcCardRepository(new SilentShieldCodec()).read(),
    ).rejects.toThrow("Kartu NFC kosong");
  });

  it("rejects corrupted payloads", async () => {
    installReader([
      {
        recordType: "mime",
        mediaType: MBC_MIME_TYPE,
        data: toDataView("{not-json"),
      },
    ]);

    await expect(
      new WebNfcCardRepository(new SilentShieldCodec()).read(),
    ).rejects.toThrow();
  });

  it("notifies when a card is detected", async () => {
    const codec = new SilentShieldCodec();
    const card = {
      memberId: "MBC001",
      name: "Anggota",
      balance: 50_000,
      visitStatus: "OUT" as const,
      checkInTimestamp: 0,
      lastUpdatedAt: 1_000,
      revision: 1,
      cardNonce: "nonce",
      logs: [],
    };
    const onDetected = vi.fn();

    installReader([
      {
        recordType: "mime",
        mediaType: MBC_MIME_TYPE,
        data: toDataView(JSON.stringify(codec.encode(card))),
      },
    ]);

    await new WebNfcCardRepository(codec, { onDetected }).read();

    expect(onDetected).toHaveBeenCalledWith("04-TEST");
  });
});
