import type { NfcIssueDialogContent } from "./types";
import { uiText } from "../i18n/ui-text";

export function getPhysicalNfcIssue({
  error,
  locale,
  nfcStatusMessage,
  nfcStatusTitle,
  webNfcSupported,
}: {
  error: unknown;
  locale: "id" | "en";
  nfcStatusMessage: string;
  nfcStatusTitle: string;
  webNfcSupported: boolean;
}): NfcIssueDialogContent | null {
  const text = uiText[locale];
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("waktu membaca nfc habis") || normalized.includes("timeout") || normalized.includes("timed out")) {
    return { title: text.nfcNotDetectedTitle, message: text.nfcNotDetectedMessage, helper: message || text.nfcDialogHelp };
  }

  if (!webNfcSupported || normalized.includes("web nfc") || normalized.includes("fitur nfc") || normalized.includes("ndefreader") || normalized.includes("notallowederror") || normalized.includes("permission")) {
    return { title: nfcStatusTitle, message: nfcStatusMessage, helper: message || text.nfcDialogHelp };
  }

  return null;
}
