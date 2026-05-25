import { describe, expect, it } from "vitest";

import { uiText } from "../../i18n/ui-text";
import { getErrorMessage, translateErrorMessage, translateFeedbackTitle } from "../errors";

describe("errors", () => {
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
});
