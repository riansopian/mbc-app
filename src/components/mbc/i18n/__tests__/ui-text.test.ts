import { describe, expect, it } from "vitest";

import { uiText } from "../ui-text";

type LocaleText = typeof uiText.id;

function textEntries(localeText: LocaleText) {
  return Object.entries(localeText) as Array<[keyof LocaleText, LocaleText[keyof LocaleText]]>;
}

describe("uiText", () => {
  it("keeps Bahasa Indonesia and English US keys in sync", () => {
    expect(Object.keys(uiText.en).sort()).toEqual(Object.keys(uiText.id).sort());
  });

  it.each([
    ["id", uiText.id],
    ["en", uiText.en],
  ] as const)("provides non-empty %s copy for every static key", (_locale, localeText) => {
    const staticEntries = textEntries(localeText).filter(
      (entry): entry is [keyof LocaleText, string] => typeof entry[1] === "string",
    );

    expect(staticEntries.length).toBeGreaterThan(100);
    expect(staticEntries.every(([, value]) => value.trim().length > 0)).toBe(true);
  });

  it("generates NFC detection messages with and without serial numbers", () => {
    expect(uiText.id.detectedWithSerial("04-ABC")).toBe(
      "Kartu terbaca dengan serial 04-ABC. Tahan kartu sampai proses selesai.",
    );
    expect(uiText.en.detectedWithSerial("04-ABC")).toBe(
      "Card detected with serial 04-ABC. Keep holding it until the process finishes.",
    );
    expect(uiText.id.detectedNoSerial).toContain("Kartu terbaca");
    expect(uiText.en.detectedNoSerial).toContain("Card detected");
  });

  it("generates active role messages for each locale", () => {
    expect(uiText.id.roleActive("Admin Koperasi")).toBe("Admin Koperasi aktif");
    expect(uiText.en.roleActive("Cooperative Admin")).toBe("Cooperative Admin active");
  });
});
