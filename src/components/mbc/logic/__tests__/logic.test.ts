// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { getErrorMessage, translateErrorMessage, translateFeedbackTitle } from "../errors";
import { getNfcStatus } from "../nfc-status";
import { uiText } from "../../i18n/ui-text";

function setNavigator({
  maxTouchPoints = 0,
  platform = "Win32",
  userAgent,
}: {
  maxTouchPoints?: number;
  platform?: string;
  userAgent: string;
}) {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: userAgent,
  });
  Object.defineProperty(navigator, "platform", {
    configurable: true,
    value: platform,
  });
  Object.defineProperty(navigator, "maxTouchPoints", {
    configurable: true,
    value: maxTouchPoints,
  });
}

function setSecureContext(value: boolean) {
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    value,
  });
}

function setNdefReader(value: unknown) {
  if (typeof value === "undefined") {
    Reflect.deleteProperty(window, "NDEFReader");
    return;
  }

  Object.defineProperty(window, "NDEFReader", {
    configurable: true,
    value,
  });
}

describe("MBC UI logic helpers", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    setNdefReader(undefined);
  });

  it("translates exact, dynamic, fallback, and feedback messages", () => {
    expect(
      translateErrorMessage(
        "Kartu belum terdaftar. Daftarkan kartu melalui menu Admin Koperasi.",
        "en",
      ),
    ).toBe("Card is not registered yet. Register the card from Cooperative Admin.");

    expect(
      translateErrorMessage(
        "Saldo tidak cukup. Biaya Rp2.000; arahkan anggota ke Admin Koperasi untuk isi saldo.",
        "en",
      ),
    ).toBe(
      "Insufficient balance. Fee Rp2.000; direct the member to Cooperative Admin for top-up.",
    );

    expect(
      translateErrorMessage("Kartu NFC gagal ditulis. Failed to write due to IO.", "en"),
    ).toContain("Failed to write NFC card.");
    expect(getErrorMessage("not an error object", "en")).toBe("Something went wrong.");
    expect(translateFeedbackTitle(uiText.id.writeNfcSuccess, "en")).toBe("NFC card saved");
    expect(translateFeedbackTitle("Custom title", "id")).toBe("Custom title");
  });

  it("describes insecure NFC context", () => {
    setSecureContext(false);
    setNavigator({
      userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125",
    });

    expect(getNfcStatus("en")).toMatchObject({
      supported: false,
      title: "Physical NFC requires HTTPS",
    });
  });

  it("describes iPhone NFC limitation even on HTTPS", () => {
    setSecureContext(true);
    setNavigator({
      maxTouchPoints: 5,
      platform: "iPhone",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    });

    expect(getNfcStatus("id")).toMatchObject({
      supported: false,
      title: "NFC browser tidak tersedia di iPhone",
    });
  });

  it("distinguishes unsupported Android Chrome from supported Web NFC", () => {
    setSecureContext(true);
    setNavigator({
      userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125",
    });
    setNdefReader(undefined);

    expect(getNfcStatus("en")).toMatchObject({
      supported: false,
      title: "Browser does not support NFC yet",
    });

    setNdefReader(class MockNdefReader {});

    expect(getNfcStatus("id")).toMatchObject({
      supported: true,
      title: "NFC fisik siap",
    });
  });
});
