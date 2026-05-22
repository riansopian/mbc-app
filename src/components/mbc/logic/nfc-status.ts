import { isWebNfcSupported } from "@/lib/mbc/web-nfc";

import type { AppLocale } from "./types";
import { uiText } from "../i18n/ui-text";

export function getNfcStatus(locale: AppLocale) {
  const text = uiText[locale];

  if (typeof window === "undefined") {
    return {
      title: locale === "id" ? "NFC fisik belum dicek" : "Physical NFC not checked yet",
      message:
        locale === "id"
          ? "Status NFC akan dicek setelah halaman dimuat."
          : "NFC status will be checked after the page loads.",
      supported: false,
    };
  }

  const userAgent = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const isChrome =
    /Chrome|CriOS/i.test(userAgent) && !/Edg|OPR|SamsungBrowser/i.test(userAgent);

  if (!window.isSecureContext) {
    return {
      title: locale === "id" ? "NFC fisik membutuhkan HTTPS" : "Physical NFC requires HTTPS",
      message:
        locale === "id"
          ? "Halaman ini belum dibuka melalui HTTPS. Untuk membaca NFC dari HP, gunakan link HTTPS seperti Cloudflare Tunnel atau link deploy."
          : "This page is not opened over HTTPS. To read NFC from a phone, use an HTTPS link such as Cloudflare Tunnel or a deployed URL.",
      supported: false,
    };
  }

  if (isIos) {
    return {
      title:
        locale === "id"
          ? "NFC browser tidak tersedia di iPhone"
          : "Browser NFC is not available on iPhone",
      message:
        locale === "id"
          ? "iPhone belum mengizinkan aplikasi web membaca atau menulis NFC. Kamu tetap bisa mencoba semua alur dengan mode simulasi. Untuk NFC fisik, gunakan Google Chrome di HP Android."
          : "iPhone does not allow web apps to read or write NFC. You can still test every flow with simulation mode. For physical NFC, use Google Chrome on Android.",
      supported: false,
    };
  }

  if (!isWebNfcSupported()) {
    return {
      title: locale === "id" ? "Browser belum mendukung NFC" : "Browser does not support NFC yet",
      message: unsupportedNfcMessage(locale, isAndroid, isChrome),
      supported: false,
    };
  }

  return {
    title: text.nfcReady,
    message:
      locale === "id"
        ? "Perangkat ini dapat membaca dan menulis kartu NFC dari browser."
        : "This device can read and write NFC cards from the browser.",
    supported: true,
  };
}

function unsupportedNfcMessage(locale: AppLocale, isAndroid: boolean, isChrome: boolean) {
  if (locale === "id") {
    if (!isAndroid) {
      return "Gunakan Google Chrome di HP Android. Browser desktop dan iPhone belum dapat membaca NFC dari aplikasi web.";
    }

    return isChrome
      ? "Google Chrome Android terdeteksi, tetapi NFC di browser belum aktif. Pastikan NFC HP menyala, halaman dibuka lewat HTTPS, dan tidak memakai mode private atau browser bawaan aplikasi."
      : "Gunakan Google Chrome di Android, bukan Safari, Firefox, Samsung Internet, atau browser bawaan aplikasi. Pastikan NFC HP aktif.";
  }

  if (!isAndroid) {
    return "Use Google Chrome on an Android phone. Desktop browsers and iPhone cannot read NFC from a web app.";
  }

  return isChrome
    ? "Google Chrome Android is detected, but browser NFC is not active yet. Make sure phone NFC is on, the page uses HTTPS, and you are not using private mode or an in-app browser."
    : "Use Google Chrome on Android, not Safari, Firefox, Samsung Internet, or an in-app browser. Make sure phone NFC is enabled.";
}
