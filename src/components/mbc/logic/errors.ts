import { uiText } from '../i18n/ui-text';
import type { AppLocale } from './types';

const errorTranslations = [
  {
    id: "Kartu belum terdaftar. Daftarkan kartu melalui menu Admin Koperasi.",
    en: "Card is not registered yet. Register the card from Cooperative Admin.",
  },
  {
    id: "Kartu belum terdaftar.",
    en: "Card is not registered yet.",
  },
  {
    id: "Member ID dan nama wajib diisi.",
    en: "Member ID and name are required.",
  },
  {
    id: "Saldo awal tidak boleh negatif.",
    en: "Initial balance cannot be negative.",
  },
  {
    id: "Nominal isi saldo harus lebih dari 0.",
    en: "Top-up amount must be greater than 0.",
  },
  {
    id: "Kartu sudah dalam status masuk. Check-in ulang tidak diperbolehkan.",
    en: "Card is already checked in. Repeated check-in is not allowed.",
  },
  {
    id: "Waktu check-in tidak valid.",
    en: "Check-in time is invalid.",
  },
  {
    id: "Waktu check-in tidak boleh melebihi waktu saat ini.",
    en: "Check-in time cannot be later than the current time.",
  },
  {
    id: "Kartu belum check-in. Check-out tidak dapat dilakukan.",
    en: "Card has not checked in yet. Check-out cannot be processed.",
  },
  {
    id: "Kartu NFC tidak berisi data Membership Benefit Card.",
    en: "NFC card does not contain Membership Benefit Card data.",
  },
  {
    id: "Kartu NFC kosong. Daftarkan kartu melalui menu Admin Koperasi.",
    en: "NFC card is empty. Register it from Cooperative Admin.",
  },
  {
    id: "Web NFC tidak tersedia.",
    en: "Web NFC is not available.",
  },
  {
    id: "Terjadi kesalahan.",
    en: "Something went wrong.",
  },
] as const;

export function translateErrorMessage(message: string, locale: AppLocale) {
  const exactMatch = errorTranslations.find(
    (translation) => translation.id === message || translation.en === message,
  );

  if (exactMatch) {
    return exactMatch[locale];
  }

  if (message.startsWith("Saldo tidak cukup.")) {
    return locale === "id"
      ? message
      : message.replace(
          /^Saldo tidak cukup\. Biaya (.+); arahkan anggota ke Admin Koperasi untuk isi saldo\.$/,
          "Insufficient balance. Fee $1; direct the member to Cooperative Admin for top-up.",
        );
  }

  if (message.startsWith("Kartu NFC gagal ditulis.")) {
    return locale === "id"
      ? message
      : "Failed to write NFC card. Hold the card longer near the phone NFC area. If it still fails, the card may not be NDEF-formatted, may be locked/read-only, or may have insufficient capacity. Use an NTAG215/NTAG216 card or format it with NFC Tools.";
  }

  return message;
}

export function getErrorMessage(error: unknown, locale: AppLocale) {
  const fallback = locale === "id" ? "Terjadi kesalahan." : "Something went wrong.";
  const message = error instanceof Error ? error.message : fallback;

  return translateErrorMessage(message, locale);
}

export function translateFeedbackTitle(title: string, locale: AppLocale) {
  const titles = [
    "transactionFailed",
    "transactionSuccess",
    "resetFailed",
    "resetNfcDone",
    "resetSimulationDone",
    "prepareNfcFailed",
    "writeNfcFailed",
    "writeNfcSuccess",
    "updateReadyTitle",
    "simulationActive",
  ] as const;
  const match = titles.find(
    (key) => uiText.id[key] === title || uiText.en[key] === title,
  );

  return match ? uiText[locale][match] : title;
}

