"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  ChevronRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  DoorClosed,
  DoorOpen,
  Eye,
  History,
  Info,
  KeyRound,
  LogOut,
  QrCode,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  SmartphoneNfc,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime, toInputDateTime } from "@/lib/mbc/format";
import { cn } from "@/lib/utils";
import { LocalNfcCardRepository } from "@/lib/mbc/repository";
import { SilentShieldCodec } from "@/lib/mbc/security";
import { MembershipCardService } from "@/lib/mbc/service";
import { MembershipBenefitTariff, SystemClock } from "@/lib/mbc/tariff";
import {
  isWebNfcSupported,
  WebNfcCardRepository,
  type WebNfcCardRepositoryEvents,
} from "@/lib/mbc/web-nfc";
import type { CardRepository, OperationResult, PlainCardData, SecureCardPayload } from "@/lib/mbc/types";

type Feedback = {
  tone: "success" | "error" | "neutral";
  title: string;
  message: string;
};

type NfcIssueDialogContent = {
  title: string;
  message: string;
  helper?: string;
};

type UserRole = "ADMIN" | "GATE" | "TERMINAL" | "MEMBER";

type AppMode = "station" | "gate" | "terminal" | "scout";
type AppLocale = "id" | "en";

const roleOptions: Array<{
  role: UserRole;
  title: string;
  description: string;
  defaultMode: AppMode;
  allowedModes: AppMode[];
}> = [
  {
    role: "ADMIN",
    title: "Admin Koperasi",
    description: "Daftarkan anggota, isi saldo, dan reset status kartu.",
    defaultMode: "station",
    allowedModes: ["station"],
  },
  {
    role: "GATE",
    title: "Petugas Pintu Masuk",
    description: "Melakukan check-in anggota.",
    defaultMode: "gate",
    allowedModes: ["gate"],
  },
  {
    role: "TERMINAL",
    title: "Petugas Pintu Keluar",
    description: "Melakukan check-out dan pemotongan saldo.",
    defaultMode: "terminal",
    allowedModes: ["terminal"],
  },
  {
    role: "MEMBER",
    title: "Anggota Koperasi",
    description: "Melihat isi kartu pribadi.",
    defaultMode: "scout",
    allowedModes: ["scout"],
  },
];

const roleContent: Record<
  AppLocale,
  Record<UserRole, { title: string; description: string }>
> = {
  id: {
    ADMIN: {
      title: "Admin Koperasi",
      description: "Daftarkan anggota, isi saldo, dan reset status kartu.",
    },
    GATE: {
      title: "Petugas Pintu Masuk",
      description: "Melakukan check-in anggota.",
    },
    TERMINAL: {
      title: "Petugas Pintu Keluar",
      description: "Melakukan check-out dan pemotongan saldo.",
    },
    MEMBER: {
      title: "Anggota Koperasi",
      description: "Melihat isi kartu pribadi.",
    },
  },
  en: {
    ADMIN: {
      title: "Cooperative Admin",
      description: "Register members, add balance, and reset card status.",
    },
    GATE: {
      title: "Entry Gate Officer",
      description: "Check members in.",
    },
    TERMINAL: {
      title: "Exit Gate Officer",
      description: "Check members out and deduct balance.",
    },
    MEMBER: {
      title: "Cooperative Member",
      description: "View personal card information.",
    },
  },
};

const uiText = {
  id: {
    login: "Login",
    logout: "Keluar",
    languageLabel: "ID",
    languageTitle: "Ganti bahasa ke English US",
    localSimulation: "Simulasi lokal",
    physicalNfc: "NFC fisik",
    silentShield: "Silent Shield",
    headline: "Membership Benefit Card",
    intro:
      "Aplikasi operasional untuk daftar anggota, check-in, check-out, isi saldo, dan baca kartu koperasi.",
    cardMode: "Mode kartu",
    nfcReady: "NFC fisik siap",
    simulationRecommended: "Mode simulasi disarankan",
    simulation: "Simulasi",
    nfcPhysical: "NFC Fisik",
    simulationTitle: "Gunakan kartu simulasi lokal",
    resetCard: "Reset kartu",
    resetCardTitle: "Kosongkan kartu",
    noCard: "Belum ada kartu",
    balance: "Saldo",
    status: "Status",
    checkIn: "Check-in",
    savedLogs: "Log tersimpan",
    pendingWriteTitle: "Perubahan kartu siap ditulis",
    pendingWriteMessage: "Tekan tombol ini, lalu tempelkan kartu NFC yang sama.",
    writeToNfc: "Tulis ke kartu NFC",
    navAdmin: "Admin",
    navEntry: "Masuk",
    navExit: "Keluar",
    navMember: "Anggota",
    adminTitle: "Admin Koperasi",
    adminDescription: "Daftarkan kartu baru, isi saldo, dan reset status kunjungan.",
    memberId: "ID Anggota",
    memberIdPlaceholder: "MBC001",
    name: "Nama",
    namePlaceholder: "Anggota Koperasi",
    initialBalance: "Saldo awal",
    initialBalancePlaceholder: "50000",
    savePhysicalCard: "Simpan ke kartu NFC",
    saveSimulatedCard: "Simpan kartu simulasi",
    topUpBalance: "Isi saldo",
    topUpPlaceholder: "25000",
    resetOut: "Reset status keluar",
    encryptedData: "Data terenkripsi",
    encryptedDescription: "Data yang tersimpan di kartu tidak dapat dibaca langsung.",
    noCardPayload: "Belum ada kartu.",
    entryTitle: "Pintu Masuk",
    entryDescription: "Tempel kartu untuk mengubah status dari keluar menjadi masuk.",
    simulationTimeMode: "Mode simulasi waktu",
    simulationTimeHelp: "Atur waktu check-in ke masa lalu untuk uji tarif.",
    checkInTime: "Waktu check-in",
    readingCard: "Membaca kartu...",
    entryValidation: "Validasi pintu masuk",
    mustBeRegistered: "Kartu wajib sudah terdaftar.",
    mustBeOut: "Status harus keluar sebelum check-in.",
    repeatedCheckInRejected: "Check-in berulang akan ditolak.",
    exitTitle: "Pintu Keluar",
    exitDescription: "Hitung tarif Rp2.000 per jam dengan pembulatan ke atas.",
    entryTime: "Masuk",
    tariff: "Tarif",
    checkOutCharge: "Check-out dan potong saldo",
    exitValidation: "Validasi pintu keluar",
    mustBeIn: "Status harus masuk sebelum check-out.",
    roundedDuration: "Durasi dibulatkan ke atas per jam.",
    insufficientBalanceHint:
      "Jika saldo tidak cukup, anggota diarahkan ke Admin Koperasi untuk isi saldo.",
    memberCardTitle: "Kartu Anggota",
    memberCardDescription: "Tampilan baca saja untuk anggota koperasi.",
    readPhysicalCard: "Baca kartu NFC",
    readSimulatedCard: "Baca kartu simulasi",
    lastUpdated: "Update terakhir",
    transactionHistory: "Riwayat transaksi",
    transactionHistoryDescription: "FIFO log, maksimal 5 transaksi terakhir.",
    type: "Tipe",
    amount: "Nominal",
    time: "Waktu",
    note: "Catatan",
    noTransactions: "Belum ada transaksi.",
    roleAccess: "Akses Petugas",
    roleLoginTitle: "Pilih peran pengguna",
    roleLoginDescription:
      "Pilih peran operasional. Setiap peran hanya membuka fitur yang sesuai dengan tanggung jawabnya.",
    enter: "Masuk",
    localSessionNote:
      "Demo ini memakai sesi lokal tanpa login server agar tetap bisa berjalan offline. Batas akses mengikuti peran: admin, pintu masuk, pintu keluar, dan anggota.",
    simulationActive: "Simulasi aktif",
    alternateModeAvailable: "Mode pengganti tersedia",
    simulationWorks:
      "Semua alur utama tetap bisa diuji di iPhone dengan kartu simulasi lokal.",
    nextRecommendation: "Rekomendasi berikutnya",
    qrRecommendation:
      "Tambahkan QR terenkripsi agar demo iPhone terasa lebih dekat dengan kartu fisik.",
    transactionRules: "Aturan utama sebelum transaksi diproses.",
    processingSimulation: "Memproses kartu simulasi",
    tapNfc: "Tempelkan kartu NFC",
    holdNfc: "Dekatkan kartu NFC ke perangkat dan tahan sampai transaksi selesai.",
    savingSimulation: "Membaca dan menyimpan data kartu simulasi.",
    transactionSuccess: "Transaksi berhasil",
    transactionFailed: "Transaksi gagal",
    resetNfcDone: "Kartu NFC dikosongkan",
    resetSimulationDone: "Kartu simulasi dikosongkan",
    restartFromAdmin:
      "Daftarkan kartu baru melalui menu Admin Koperasi untuk memulai ulang alur.",
    resetFailed: "Reset kartu gagal",
    detectedTitle: "Kartu NFC terdeteksi",
    detectedWithSerial: (serial: string) =>
      `Kartu terbaca dengan serial ${serial}. Tahan kartu sampai proses selesai.`,
    detectedNoSerial: "Kartu terbaca. Tahan kartu sampai proses selesai.",
    readFirstTitle: "Tempelkan kartu NFC untuk dibaca",
    readFirstMessage:
      "Aplikasi akan membaca kartu dulu, lalu menyiapkan perubahan. Setelah itu tekan tombol tulis ke kartu.",
    updateReadyTitle: "Belum tersimpan ke kartu fisik",
    updateReadyMessage:
      "Data kartu valid, tetapi status di kartu belum berubah. Tekan Tulis ke kartu NFC, lalu tempelkan kartu yang sama sampai berhasil.",
    prepareNfcFailed: "Gagal menyiapkan perubahan NFC",
    checkoutCardStillOut:
      "Kartu fisik yang dibaca masih berstatus OUT. Kemungkinan check-in sebelumnya belum ditulis ke kartu. Kembali ke peran Pintu Masuk, tekan Check-in, lalu wajib tekan Tulis ke kartu NFC sampai muncul pesan kartu berhasil disimpan.",
    noPendingWrite: "Belum ada perubahan untuk ditulis",
    prepareFirst: "Baca kartu dan siapkan transaksi terlebih dahulu.",
    writeNfcTitle: "Tempelkan kartu NFC untuk ditulis",
    writeSameCard: "Pastikan kartu yang ditempel adalah kartu yang baru dibaca.",
    writeNfcSuccess: "Kartu NFC berhasil disimpan",
    writeNfcSuccessMessage: "Perubahan sudah tersimpan ke kartu fisik.",
    writeNfcFailed: "Gagal menulis kartu NFC",
    nfcDialogEyebrow: "Mode NFC fisik",
    nfcDialogHelp:
      "Mode simulasi tetap bisa dipakai untuk menguji registrasi, check-in, check-out, top-up, dan baca kartu.",
    useSimulationMode: "Pakai simulasi",
    closeDialog: "Tutup",
    nfcNotDetectedTitle: "Kartu NFC tidak terdeteksi",
    nfcNotDetectedMessage:
      "Tempelkan kartu lebih dekat ke area NFC HP, tahan beberapa detik, lalu coba lagi. Pastikan NFC HP aktif dan kartu mendukung NDEF.",
    roleActive: (roleTitle: string) => `${roleTitle} aktif`,
    readOnlySuccess: "Kartu berhasil dibaca.",
  },
  en: {
    login: "Login",
    logout: "Logout",
    languageLabel: "EN",
    languageTitle: "Switch language to Bahasa Indonesia",
    localSimulation: "Local simulation",
    physicalNfc: "Physical NFC",
    silentShield: "Silent Shield",
    headline: "Membership Benefit Card",
    intro:
      "An operations app for member registration, check-in, check-out, balance top-up, and cooperative card lookup.",
    cardMode: "Card mode",
    nfcReady: "Physical NFC ready",
    simulationRecommended: "Simulation mode recommended",
    simulation: "Simulation",
    nfcPhysical: "Physical NFC",
    simulationTitle: "Use local simulated card",
    resetCard: "Reset card",
    resetCardTitle: "Clear card",
    noCard: "No card yet",
    balance: "Balance",
    status: "Status",
    checkIn: "Check-in",
    savedLogs: "Saved logs",
    pendingWriteTitle: "Card update is ready",
    pendingWriteMessage: "Press this button, then tap the same NFC card.",
    writeToNfc: "Write to NFC card",
    navAdmin: "Admin",
    navEntry: "Entry",
    navExit: "Exit",
    navMember: "Member",
    adminTitle: "Cooperative Admin",
    adminDescription: "Register a new card, add balance, and reset visit status.",
    memberId: "Member ID",
    memberIdPlaceholder: "MBC001",
    name: "Name",
    namePlaceholder: "Cooperative Member",
    initialBalance: "Initial balance",
    initialBalancePlaceholder: "50000",
    savePhysicalCard: "Save to NFC card",
    saveSimulatedCard: "Save simulated card",
    topUpBalance: "Add balance",
    topUpPlaceholder: "25000",
    resetOut: "Reset to checked out",
    encryptedData: "Encrypted data",
    encryptedDescription: "Card data is stored in encrypted form.",
    noCardPayload: "No card yet.",
    entryTitle: "Entry Gate",
    entryDescription: "Tap a card to change the status from checked out to checked in.",
    simulationTimeMode: "Time simulation mode",
    simulationTimeHelp: "Set check-in time in the past to test tariff calculation.",
    checkInTime: "Check-in time",
    readingCard: "Reading card...",
    entryValidation: "Entry validation",
    mustBeRegistered: "The card must already be registered.",
    mustBeOut: "Status must be checked out before check-in.",
    repeatedCheckInRejected: "Repeated check-in will be rejected.",
    exitTitle: "Exit Gate",
    exitDescription: "Calculate Rp2,000 per hour, rounded up.",
    entryTime: "Entry time",
    tariff: "Tariff",
    checkOutCharge: "Check-out and deduct balance",
    exitValidation: "Exit validation",
    mustBeIn: "Status must be checked in before check-out.",
    roundedDuration: "Duration is rounded up per hour.",
    insufficientBalanceHint:
      "If balance is insufficient, direct the member to Cooperative Admin for top-up.",
    memberCardTitle: "Member Card",
    memberCardDescription: "Read-only view for cooperative members.",
    readPhysicalCard: "Read NFC card",
    readSimulatedCard: "Read simulated card",
    lastUpdated: "Last updated",
    transactionHistory: "Transaction history",
    transactionHistoryDescription: "FIFO log, maximum 5 latest transactions.",
    type: "Type",
    amount: "Amount",
    time: "Time",
    note: "Note",
    noTransactions: "No transactions yet.",
    roleAccess: "Staff Access",
    roleLoginTitle: "Choose user role",
    roleLoginDescription:
      "Choose an operational role. Each role only unlocks features that match its responsibility.",
    enter: "Enter",
    localSessionNote:
      "This demo uses a local session without server login so it can still run offline. Access is limited by role: admin, entry gate, exit gate, and member.",
    simulationActive: "Simulation active",
    alternateModeAvailable: "Alternate mode available",
    simulationWorks:
      "All core flows can still be tested on iPhone with a local simulated card.",
    nextRecommendation: "Next recommendation",
    qrRecommendation:
      "Add encrypted QR support so the iPhone demo feels closer to a physical card.",
    transactionRules: "Main rules before the transaction is processed.",
    processingSimulation: "Processing simulated card",
    tapNfc: "Tap NFC card",
    holdNfc: "Hold the NFC card near the device until the transaction finishes.",
    savingSimulation: "Reading and saving simulated card data.",
    transactionSuccess: "Transaction successful",
    transactionFailed: "Transaction failed",
    resetNfcDone: "NFC card cleared",
    resetSimulationDone: "Simulated card cleared",
    restartFromAdmin: "Register a new card from Cooperative Admin to restart the flow.",
    resetFailed: "Failed to reset card",
    detectedTitle: "NFC card detected",
    detectedWithSerial: (serial: string) =>
      `Card detected with serial ${serial}. Keep holding it until the process finishes.`,
    detectedNoSerial: "Card detected. Keep holding it until the process finishes.",
    readFirstTitle: "Tap NFC card to read",
    readFirstMessage:
      "The app will read the card first, then prepare the update. After that, press the write button.",
    updateReadyTitle: "Not saved to the physical card yet",
    updateReadyMessage:
      "The card data is valid, but the physical card has not changed yet. Press Write to NFC card, then tap the same card until it succeeds.",
    prepareNfcFailed: "Failed to prepare NFC update",
    checkoutCardStillOut:
      "The physical card is still checked out. The previous check-in was probably not written to the card. Go back to Entry Gate, press Check-in, then press Write to NFC card until the card saved message appears.",
    noPendingWrite: "No update ready to write",
    prepareFirst: "Read the card and prepare a transaction first.",
    writeNfcTitle: "Tap NFC card to write",
    writeSameCard: "Make sure this is the same card that was just read.",
    writeNfcSuccess: "NFC card saved",
    writeNfcSuccessMessage: "The update has been saved to the physical card.",
    writeNfcFailed: "Failed to write NFC card",
    nfcDialogEyebrow: "Physical NFC mode",
    nfcDialogHelp:
      "Simulation mode can still test registration, check-in, check-out, top-up, and card lookup.",
    useSimulationMode: "Use simulation",
    closeDialog: "Close",
    nfcNotDetectedTitle: "NFC card was not detected",
    nfcNotDetectedMessage:
      "Move the card closer to the phone NFC area, hold it for a few seconds, then try again. Make sure phone NFC is enabled and the card supports NDEF.",
    roleActive: (roleTitle: string) => `${roleTitle} active`,
    readOnlySuccess: "Card read successfully.",
  },
} as const;

function roleTitle(role: UserRole, locale: AppLocale) {
  return roleContent[locale][role].title;
}

function roleDescription(role: UserRole, locale: AppLocale) {
  return roleContent[locale][role].description;
}

function parseRoleValue(value?: string | null): UserRole | null {
  const role = value?.replace("#role=", "").toUpperCase();

  return roleOptions.some((option) => option.role === role) ? (role as UserRole) : null;
}

function parseNfcMode(value?: string | null) {
  return value === "physical";
}

function buildModeHref(role: UserRole | null, physical: boolean) {
  const params = new URLSearchParams();

  if (role) {
    params.set("role", role.toLowerCase());
  }

  if (physical) {
    params.set("nfc", "physical");
  }

  const query = params.toString();

  return query ? `/?${query}` : "/";
}

const quickTopUps = [10000, 25000, 50000];

function parseAmountInput(value: string) {
  return value.trim() ? Number(value) : Number.NaN;
}

class DraftCardRepository implements CardRepository {
  constructor(private card: PlainCardData | null) {}

  async read() {
    return this.card ? structuredClone(this.card) : null;
  }

  async write(card: PlainCardData) {
    this.card = structuredClone(card);
  }

  async clear() {
    this.card = null;
  }

  async exportSecurePayload(): Promise<SecureCardPayload | null> {
    return null;
  }
}

function getNfcStatus(locale: AppLocale) {
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
  const isChrome = /Chrome|CriOS/i.test(userAgent) && !/Edg|OPR|SamsungBrowser/i.test(userAgent);

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
      message:
        locale === "id"
          ? isAndroid
            ? isChrome
              ? "Google Chrome Android terdeteksi, tetapi NFC di browser belum aktif. Pastikan NFC HP menyala, halaman dibuka lewat HTTPS, dan tidak memakai mode private atau browser bawaan aplikasi."
              : "Gunakan Google Chrome di Android, bukan Safari, Firefox, Samsung Internet, atau browser bawaan aplikasi. Pastikan NFC HP aktif."
            : "Gunakan Google Chrome di HP Android. Browser desktop dan iPhone belum dapat membaca NFC dari aplikasi web."
          : isAndroid
            ? isChrome
              ? "Google Chrome Android is detected, but browser NFC is not active yet. Make sure phone NFC is on, the page uses HTTPS, and you are not using private mode or an in-app browser."
              : "Use Google Chrome on Android, not Safari, Firefox, Samsung Internet, or an in-app browser. Make sure phone NFC is enabled."
            : "Use Google Chrome on an Android phone. Desktop browsers and iPhone cannot read NFC from a web app.",
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

function createService(
  usePhysicalNfc: boolean,
  webNfcEvents?: WebNfcCardRepositoryEvents,
) {
  const codec = new SilentShieldCodec();

  return new MembershipCardService(
    usePhysicalNfc
      ? new WebNfcCardRepository(codec, webNfcEvents)
      : new LocalNfcCardRepository(codec),
    new MembershipBenefitTariff(),
    new SystemClock(),
  );
}

async function readLocalInitialCard() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return await createService(false).getCard();
  } catch {
    return null;
  }
}

function statusBadge(card: PlainCardData | null, locale: AppLocale) {
  if (!card) {
    return <Badge variant="secondary">{uiText[locale].noCard}</Badge>;
  }

  return card.visitStatus === "IN" ? (
    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">IN</Badge>
  ) : (
    <Badge variant="outline" className="border-primary/30 bg-white text-primary">
      OUT
    </Badge>
  );
}

function metricItems(card: PlainCardData | null, locale: AppLocale) {
  const text = uiText[locale];

  return [
    {
      label: text.balance,
      value: card ? formatCurrency(card.balance) : "-",
      icon: WalletCards,
    },
    {
      label: text.status,
      value: card?.visitStatus ?? "-",
      icon: ScanLine,
    },
    {
      label: text.checkIn,
      value: card?.checkInTimestamp ? formatDateTime(card.checkInTimestamp) : "-",
      icon: Clock3,
    },
    {
      label: text.savedLogs,
      value: `${card?.logs.length ?? 0}/5`,
      icon: History,
    },
  ];
}

export function MbcApp({
  initialRole,
}: {
  initialRole?: string | null;
}) {
  const [activeRole, setActiveRole] = useState<UserRole | null>(() =>
    parseRoleValue(initialRole),
  );
  const [card, setCard] = useState<PlainCardData | null>(null);
  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [locale, setLocale] = useState<AppLocale>("id");
  const [physicalNfc, setPhysicalNfc] = useState(false);
  const [webNfcSupported, setWebNfcSupported] = useState(false);
  const [pendingPhysicalWrite, setPendingPhysicalWrite] = useState<PlainCardData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [nfcStatusTitle, setNfcStatusTitle] = useState("NFC fisik belum dicek");
  const [nfcStatusMessage, setNfcStatusMessage] = useState(
    "NFC fisik membutuhkan Chrome Android dan HTTPS.",
  );
  const [nfcIssueDialog, setNfcIssueDialog] =
    useState<NfcIssueDialogContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [simulationMode, setSimulationMode] = useState(true);
  const [simulatedCheckIn, setSimulatedCheckIn] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({
    tone: "neutral",
    title: "Mode siap",
    message: "Gunakan simulasi lokal untuk demo di iPhone, atau NFC fisik di Google Chrome Android.",
  });

  const text = uiText[locale];
  const webNfcEvents = useMemo<WebNfcCardRepositoryEvents>(
    () => ({
      onDetected: (serialNumber) => {
        setFeedback({
          tone: "success",
          title: uiText[locale].detectedTitle,
          message: serialNumber
            ? uiText[locale].detectedWithSerial(serialNumber)
            : uiText[locale].detectedNoSerial,
        });
      },
    }),
    [locale],
  );
  const service = useMemo(
    () => createService(physicalNfc, webNfcEvents),
    [physicalNfc, webNfcEvents],
  );
  const roleConfig = roleOptions.find((option) => option.role === activeRole);
  const allowedModes = roleConfig?.allowedModes ?? [];
  const showModeTabs = allowedModes.length > 1;
  const canResetCard = activeRole === "ADMIN";
  const securePayload = useMemo(() => {
    if (!card) {
      return "";
    }

    return JSON.stringify(new SilentShieldCodec().encode(card), null, 2);
  }, [card]);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      try {
        if ("serviceWorker" in navigator && window.location.protocol === "https:") {
          navigator.serviceWorker.register("/sw.js").catch(() => {
            // Cache offline bersifat tambahan; transaksi tetap dapat berjalan tanpa cache.
          });
        }

        const storedLocale =
          window.localStorage.getItem("mbc.locale") === "en" ? "en" : "id";
        setLocale(storedLocale);

        const nfcStatus = getNfcStatus(storedLocale);
        const params = new URLSearchParams(window.location.search);
        const requestedPhysicalNfc = parseNfcMode(params.get("nfc"));

        setWebNfcSupported(nfcStatus.supported);
        setPhysicalNfc(requestedPhysicalNfc || nfcStatus.supported);
        setNfcStatusTitle(nfcStatus.title);
        setNfcStatusMessage(nfcStatus.message);
        if (requestedPhysicalNfc && !nfcStatus.supported) {
          setNfcIssueDialog({
            title: nfcStatus.title,
            message: nfcStatus.message,
            helper: uiText[storedLocale].nfcDialogHelp,
          });
        }
        setSimulatedCheckIn(toInputDateTime(Date.now() - 65 * 60 * 1000));

        const roleFromUrl =
          parseRoleValue(params.get("role")) ?? parseRoleValue(window.location.hash);
        if (roleFromUrl) {
          setActiveRole(roleFromUrl);
        }

        const storedCard = await readLocalInitialCard();
        if (!nfcStatus.supported) {
          setCard(storedCard);
        }
      } finally {
        setMounted(true);
      }
    });
  }, []);

  async function handleOperation(operation: () => Promise<OperationResult>) {
    setBusy(true);
    setFeedback({
      tone: "neutral",
      title: physicalNfc ? text.tapNfc : text.processingSimulation,
      message: physicalNfc ? text.holdNfc : text.savingSimulation,
    });

    try {
      const result = await operation();
      setCard(result.card);
      setPendingPhysicalWrite(null);
      setFeedback({
        tone: "success",
        title: text.transactionSuccess,
        message:
          result.fee && result.durationHours
            ? `${result.message} Durasi ${result.durationHours} jam, biaya ${formatCurrency(result.fee)}.`
            : result.message,
      });
    } catch (error) {
      showPhysicalNfcIssue(error);
      setFeedback({
        tone: "error",
        title: text.transactionFailed,
        message: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function clearCard() {
    setBusy(true);

    try {
      await service.clearCard();
      setCard(null);
      setFeedback({
        tone: "neutral",
        title: physicalNfc ? text.resetNfcDone : text.resetSimulationDone,
        message: text.restartFromAdmin,
      });
    } catch (error) {
      showPhysicalNfcIssue(error);
      setFeedback({
        tone: "error",
        title: text.resetFailed,
        message: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function stagePhysicalOperation(
    operation: (draftService: MembershipCardService) => Promise<OperationResult>,
  ) {
    setBusy(true);
    setFeedback({
      tone: "neutral",
      title: text.readFirstTitle,
      message: text.readFirstMessage,
    });

    try {
      const physicalRepository = new WebNfcCardRepository(
        new SilentShieldCodec(),
        webNfcEvents,
      );
      const sourceCard = await physicalRepository.read();
      const draftRepository = new DraftCardRepository(sourceCard);
      const draftService = new MembershipCardService(
        draftRepository,
        new MembershipBenefitTariff(),
        new SystemClock(),
      );
      const result = await operation(draftService);

      setCard(result.card);
      setPendingPhysicalWrite(result.card);
      setFeedback({
        tone: "neutral",
        title: text.updateReadyTitle,
        message: text.updateReadyMessage,
      });
    } catch (error) {
      showPhysicalNfcIssue(error);
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan.";
      const isCheckoutStillOut =
        activeRole === "TERMINAL" && errorMessage.includes("Kartu belum check-in");
      setFeedback({
        tone: "error",
        title: text.prepareNfcFailed,
        message: isCheckoutStillOut ? text.checkoutCardStillOut : errorMessage,
      });
    } finally {
      setBusy(false);
    }
  }

  async function writePendingPhysicalCard() {
    if (!pendingPhysicalWrite) {
      setFeedback({
        tone: "error",
        title: text.noPendingWrite,
        message: text.prepareFirst,
      });
      return;
    }

    setBusy(true);
    setFeedback({
      tone: "neutral",
      title: text.writeNfcTitle,
      message: text.writeSameCard,
    });

    try {
      await new WebNfcCardRepository(new SilentShieldCodec()).write(pendingPhysicalWrite);
      setCard(pendingPhysicalWrite);
      setPendingPhysicalWrite(null);
      setFeedback({
        tone: "success",
        title: text.writeNfcSuccess,
        message: text.writeNfcSuccessMessage,
      });
    } catch (error) {
      showPhysicalNfcIssue(error);
      setFeedback({
        tone: "error",
        title: text.writeNfcFailed,
        message: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setBusy(false);
    }
  }

  function runMutation(
    operation: (targetService: MembershipCardService) => Promise<OperationResult>,
  ) {
    if (!physicalNfc) {
      void handleOperation(() => operation(service));
      return;
    }

    void stagePhysicalOperation(operation);
  }

  function getPhysicalNfcIssue(error: unknown): NfcIssueDialogContent | null {
    const message = error instanceof Error ? error.message : "";
    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("waktu membaca nfc habis") ||
      normalizedMessage.includes("timeout") ||
      normalizedMessage.includes("timed out")
    ) {
      return {
        title: text.nfcNotDetectedTitle,
        message: text.nfcNotDetectedMessage,
        helper: message || text.nfcDialogHelp,
      };
    }

    if (
      !webNfcSupported ||
      normalizedMessage.includes("web nfc") ||
      normalizedMessage.includes("fitur nfc") ||
      normalizedMessage.includes("ndefreader") ||
      normalizedMessage.includes("notallowederror") ||
      normalizedMessage.includes("permission")
    ) {
      return {
        title: nfcStatusTitle,
        message: nfcStatusMessage,
        helper: message || text.nfcDialogHelp,
      };
    }

    return null;
  }

  function showPhysicalNfcIssue(error: unknown) {
    if (!physicalNfc) {
      return;
    }

    const issue = getPhysicalNfcIssue(error);

    if (issue) {
      setNfcIssueDialog(issue);
    }
  }

  function activateSimulationMode() {
    setPhysicalNfc(false);
    setPendingPhysicalWrite(null);
    setNfcIssueDialog(null);
    window.history.replaceState(null, "", buildModeHref(activeRole, false));
    setFeedback({
      tone: "neutral",
      title: text.simulationActive,
      message: text.simulationWorks,
    });
  }

  function activatePhysicalNfcMode() {
    setPhysicalNfc(true);
    window.history.replaceState(null, "", buildModeHref(activeRole, true));

    if (!webNfcSupported) {
      const issue = {
        title: nfcStatusTitle,
        message: nfcStatusMessage,
        helper: text.nfcDialogHelp,
      };

      setNfcIssueDialog(issue);
      setFeedback({
        tone: "error",
        title: issue.title,
        message: issue.message,
      });
    }
  }

  function loginAsRole(role: UserRole) {
    const nextRole = roleOptions.find((option) => option.role === role);

    if (!nextRole) {
      return;
    }

    setActiveRole(role);
    window.history.replaceState(null, "", buildModeHref(role, physicalNfc));
    setFeedback({
      tone: "success",
      title: text.roleActive(roleTitle(role, locale)),
      message: roleDescription(role, locale),
    });
  }

  function focusLoginPanel() {
    document.getElementById("role-login")?.scrollIntoView({ behavior: "smooth" });
  }

  function toggleLocale() {
    const nextLocale: AppLocale = locale === "id" ? "en" : "id";
    setLocale(nextLocale);
    window.localStorage.setItem("mbc.locale", nextLocale);

    const nfcStatus = getNfcStatus(nextLocale);
    setNfcStatusTitle(nfcStatus.title);
    setNfcStatusMessage(nfcStatus.message);
    if (nfcIssueDialog) {
      setNfcIssueDialog({
        title: nfcStatus.title,
        message: nfcStatus.message,
        helper: uiText[nextLocale].nfcDialogHelp,
      });
    }
  }

  const nfcReadyLabel = webNfcSupported
    ? text.nfcReady
    : text.simulationRecommended;

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#fff1f3_16%,#fff7f8_48%,#fff_100%)] text-foreground">
        <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 shadow-[0_4px_18px_rgba(0,0,0,0.10)] backdrop-blur">
          <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <TelkomselMark />
            <div className="h-14 min-w-28 rounded-full bg-primary sm:min-w-52" />
          </div>
        </header>
        <section className="mx-auto flex max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <Card className="w-full max-w-5xl bg-[#fffafb] px-2 py-10 sm:px-10">
            <CardHeader className="gap-4">
              <div className="h-8 w-28 rounded-full bg-accent" />
              <div className="h-11 w-full max-w-xl rounded-2xl bg-slate-100" />
              <div className="h-6 w-full max-w-2xl rounded-full bg-slate-100" />
            </CardHeader>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fff4f5_24%,#fff9fa_58%,#ffffff_100%)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/96 shadow-[0_6px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:h-24 sm:px-6 lg:px-8">
          <TelkomselMark />
          <div className="flex items-center gap-3">
            <a
              href={activeRole ? "/" : "#role-login"}
              className={cn(
                buttonVariants({
                  variant: activeRole ? "outline" : "default",
                }),
                "h-12 min-w-24 rounded-full px-4 text-sm sm:h-14 sm:min-w-52 sm:text-lg",
              )}
              onClick={(event) => {
                if (activeRole) {
                  return;
                }

                event.preventDefault();
                focusLoginPanel();
              }}
            >
              {activeRole ? (
                <>
                  <LogOut className="h-4 w-4" />
                  {text.logout}
                </>
              ) : (
                <>
                  <UserRound className="h-4 w-4" />
                  {text.login}
                </>
              )}
            </a>
            <Button
              variant="outline"
              className="h-12 shrink-0 gap-2 rounded-full border-slate-200 px-4 text-[#001a41] sm:h-14"
              onClick={toggleLocale}
              title={text.languageTitle}
              aria-label={text.languageTitle}
            >
              <LanguageFlag locale={locale} />
              {text.languageLabel}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {nfcIssueDialog ? (
        <NfcIssueDialog
          title={nfcIssueDialog.title}
          message={nfcIssueDialog.message}
          helper={nfcIssueDialog.helper ?? text.nfcDialogHelp}
          locale={locale}
          onUseSimulation={activateSimulationMode}
          onClose={() => setNfcIssueDialog(null)}
        />
      ) : null}

      {!activeRole ? (
        <RoleLoginPanel locale={locale} onLogin={loginAsRole} />
      ) : null}

      <section className={activeRole ? "bg-transparent" : "hidden"}>
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="h-8 gap-1 rounded-full bg-white px-3 text-[#001a41] shadow-sm">
                  <SmartphoneNfc className="h-3.5 w-3.5" />
                  {physicalNfc ? text.physicalNfc : text.localSimulation}
                </Badge>
                <Badge variant="outline" className="h-8 gap-1 rounded-full border-primary/20 bg-white px-3 text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {activeRole ? roleTitle(activeRole, locale) : text.silentShield}
                </Badge>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-normal text-[#001a41] sm:text-5xl">
                  {text.headline}
                </h1>
                <p className="mt-3 max-w-3xl text-[0.95rem] leading-7 text-slate-600 sm:text-base">
                  {text.intro}
                </p>
              </div>
            </div>
            <div className="rounded-[28px] border border-white bg-white/90 p-3 shadow-[0_18px_48px_rgba(0,26,65,0.09)]">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{text.cardMode}</p>
                  <p className="mt-1 text-sm font-extrabold text-[#001a41]">{nfcReadyLabel}</p>
                </div>
                {statusBadge(card, locale)}
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-[22px] bg-slate-100 p-1.5">
                <a
                  href={buildModeHref(activeRole, false)}
                  onClick={(event) => {
                    event.preventDefault();
                    activateSimulationMode();
                  }}
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-3 py-2 text-center text-sm font-bold transition",
                    !physicalNfc
                      ? "bg-primary text-white shadow-[0_12px_24px_rgba(237,27,47,0.22)]"
                      : "bg-transparent text-[#001a41]",
                  )}
                  title={text.simulationTitle}
                >
                  <QrCode className="h-4 w-4" />
                  {text.simulation}
                </a>
                <a
                  href={buildModeHref(activeRole, true)}
                  onClick={(event) => {
                    event.preventDefault();
                    activatePhysicalNfcMode();
                  }}
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-3 py-2 text-center text-sm font-bold transition",
                    physicalNfc
                      ? "bg-primary text-white shadow-[0_12px_24px_rgba(237,27,47,0.22)]"
                      : "bg-transparent text-[#001a41]",
                  )}
                  title={nfcStatusMessage}
                >
                  <SmartphoneNfc className="h-4 w-4" />
                  {text.nfcPhysical}
                </a>
              </div>
              {canResetCard ? (
                <Button
                  variant="outline"
                  className="mt-3 h-11 w-full border-slate-200 bg-white text-[#001a41]"
                  onClick={clearCard}
                  disabled={busy}
                  title={text.resetCardTitle}
                  aria-label={text.resetCardTitle}
                >
                  <RefreshCcw className="h-4 w-4" />
                  {text.resetCard}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metricItems(card, locale).map((item) => (
              <Card key={item.label} size="sm" className="bg-white/95">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardDescription>{item.label}</CardDescription>
                  <item.icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="min-h-8 break-words text-xl font-extrabold tracking-normal text-[#001a41] sm:text-2xl">
                    {busy ? <Skeleton className="h-8 w-24 rounded-full" /> : item.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Alert
            variant={feedback.tone === "error" ? "destructive" : "default"}
            className={cn(
              "rounded-[22px] border-white bg-white/95 px-5 py-4 shadow-sm",
              feedback.tone === "success" ? "border-emerald-100 text-emerald-700" : "",
            )}
          >
            <FeedbackGlyph tone={feedback.tone} />
            <AlertTitle>{feedback.title}</AlertTitle>
            <AlertDescription>{feedback.message}</AlertDescription>
          </Alert>
          {physicalNfc && pendingPhysicalWrite ? (
            <div className="rounded-[24px] border-2 border-primary bg-white p-4 shadow-[0_18px_44px_rgba(237,27,47,0.16)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-extrabold text-primary">{text.pendingWriteTitle}</p>
                  <p className="text-sm font-semibold leading-6 text-[#001a41]">
                    {text.pendingWriteMessage}
                  </p>
                </div>
                <Button
                  className="h-12 shadow-[0_12px_28px_rgba(237,27,47,0.24)]"
                  disabled={busy}
                  onClick={() => void writePendingPhysicalCard()}
                >
                  <SmartphoneNfc className="h-4 w-4" />
                  {text.writeToNfc}
                </Button>
              </div>
            </div>
          ) : null}
          {!webNfcSupported ? (
            <NfcSupportNotice
              title={nfcStatusTitle}
              message={nfcStatusMessage}
              isSimulationActive={!physicalNfc}
              locale={locale}
            />
          ) : null}
        </div>
      </section>

      <section className={activeRole ? "mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-6 lg:px-8" : "hidden"}>
        <Tabs key={activeRole ?? "guest"} defaultValue={roleConfig?.defaultMode ?? "station"} className="space-y-6">
          {showModeTabs ? (
            <TabsList className="grid !h-auto w-full grid-cols-1 gap-2 rounded-[24px] bg-white p-2 shadow-[0_12px_34px_rgba(0,26,65,0.08)] sm:rounded-full">
              {allowedModes.includes("station") ? (
                <TabsTrigger value="station" className="h-12 gap-2 rounded-full data-active:bg-primary data-active:text-white">
                  <CreditCard className="h-4 w-4" />
                  {text.navAdmin}
                </TabsTrigger>
              ) : null}
              {allowedModes.includes("gate") ? (
                <TabsTrigger value="gate" className="h-12 gap-2 rounded-full data-active:bg-primary data-active:text-white">
                  <DoorOpen className="h-4 w-4" />
                  {text.navEntry}
                </TabsTrigger>
              ) : null}
              {allowedModes.includes("terminal") ? (
                <TabsTrigger value="terminal" className="h-12 gap-2 rounded-full data-active:bg-primary data-active:text-white">
                  <DoorClosed className="h-4 w-4" />
                  {text.navExit}
                </TabsTrigger>
              ) : null}
              {allowedModes.includes("scout") ? (
                <TabsTrigger value="scout" className="h-12 gap-2 rounded-full data-active:bg-primary data-active:text-white">
                  <Eye className="h-4 w-4" />
                  {text.navMember}
                </TabsTrigger>
              ) : null}
            </TabsList>
          ) : null}

          {allowedModes.includes("station") ? (
          <TabsContent value="station" className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <Card id="station" className="bg-[#fffafb]">
              <CardHeader>
                <CardTitle className="text-2xl">{text.adminTitle}</CardTitle>
                <CardDescription>
                  {text.adminDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="member-id">{text.memberId}</Label>
                    <Input
                      id="member-id"
                      value={memberId}
                      placeholder={text.memberIdPlaceholder}
                      onChange={(event) => setMemberId(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-name">{text.name}</Label>
                    <Input
                      id="member-name"
                      value={name}
                      placeholder={text.namePlaceholder}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initial-balance">{text.initialBalance}</Label>
                    <Input
                      id="initial-balance"
                      type="number"
                      min={0}
                      value={initialBalance}
                      placeholder={text.initialBalancePlaceholder}
                      onChange={(event) => setInitialBalance(event.target.value)}
                    />
                  </div>
                </div>
                <Button
                  className="w-full sm:w-auto"
                  disabled={busy}
                  onClick={() =>
                    handleOperation(() =>
                      service.register(memberId, name, parseAmountInput(initialBalance)),
                    )
                  }
                >
                  <KeyRound className="h-4 w-4" />
                  {physicalNfc ? text.savePhysicalCard : text.saveSimulatedCard}
                </Button>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="topup">{text.topUpBalance}</Label>
                    <Input
                      id="topup"
                      type="number"
                      min={1}
                      value={topUpAmount}
                      placeholder={text.topUpPlaceholder}
                      onChange={(event) => setTopUpAmount(event.target.value)}
                    />
                  </div>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      runMutation((targetService) =>
                        targetService.topUp(parseAmountInput(topUpAmount)),
                      )
                    }
                  >
                    <Banknote className="h-4 w-4" />
                    {text.topUpBalance}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickTopUps.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => runMutation((targetService) => targetService.topUp(amount))}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      runMutation((targetService) => targetService.resetVisitStatus())
                    }
                  >
                    {text.resetOut}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#fffafb]">
              <CardHeader>
                <CardTitle className="text-2xl">{text.encryptedData}</CardTitle>
                <CardDescription>
                  {text.encryptedDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  readOnly
                  value={busy ? "" : securePayload || text.noCardPayload}
                  placeholder={busy ? text.readingCard : undefined}
                  className="min-h-80 resize-none rounded-[18px] bg-white font-mono text-xs"
                />
              </CardContent>
            </Card>
          </TabsContent>
          ) : null}

          {allowedModes.includes("gate") ? (
          <TabsContent value="gate" className="grid gap-5 lg:grid-cols-[0.9fr_1fr]">
            <Card id="gate" className="bg-[#fffafb]">
              <CardHeader>
                <CardTitle className="text-2xl">{text.entryTitle}</CardTitle>
                <CardDescription>
                  {text.entryDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-white p-5">
                  <div className="space-y-1">
                    <Label htmlFor="simulation-mode">{text.simulationTimeMode}</Label>
                    <p className="text-sm text-slate-500">
                      {text.simulationTimeHelp}
                    </p>
                  </div>
                  <Switch
                    id="simulation-mode"
                  checked={simulationMode}
                    disabled={busy}
                  onCheckedChange={setSimulationMode}
                  />
                </div>
                {simulationMode ? (
                  <div className="space-y-2">
                    <Label htmlFor="checkin-time">{text.checkInTime}</Label>
                    <Input
                      id="checkin-time"
                      type="datetime-local"
                      value={simulatedCheckIn}
                      onChange={(event) => setSimulatedCheckIn(event.target.value)}
                    />
                  </div>
                ) : null}
                <Button
                  size="lg"
                  className="h-14 w-full"
                  disabled={busy}
                  onClick={() =>
                    runMutation((targetService) =>
                      targetService.checkIn(
                        simulationMode
                          ? new Date(simulatedCheckIn).getTime()
                          : undefined,
                      ),
                    )
                  }
                >
                  <ScanLine className="h-5 w-5" />
                  {busy ? text.readingCard : text.checkIn}
                </Button>
              </CardContent>
            </Card>

            <ModeNotes
              title={text.entryValidation}
              description={text.transactionRules}
              items={[
                text.mustBeRegistered,
                text.mustBeOut,
                text.repeatedCheckInRejected,
              ]}
            />
          </TabsContent>
          ) : null}

          {allowedModes.includes("terminal") ? (
          <TabsContent value="terminal" className="grid gap-5 lg:grid-cols-[0.9fr_1fr]">
            <Card className="bg-[#fffafb]">
              <CardHeader>
                <CardTitle className="text-2xl">{text.exitTitle}</CardTitle>
                <CardDescription>
                  {text.exitDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile
                    label={text.entryTime}
                    value={formatDateTime(card?.checkInTimestamp ?? 0)}
                    loading={busy}
                  />
                  <InfoTile label={text.tariff} value="Rp2.000 / jam" />
                </div>
                <Button
                  size="lg"
                  className="h-14 w-full"
                  disabled={busy}
                  onClick={() => runMutation((targetService) => targetService.checkOut())}
                >
                  <ScanLine className="h-5 w-5" />
                  {busy ? text.readingCard : text.checkOutCharge}
                </Button>
              </CardContent>
            </Card>

            <ModeNotes
              title={text.exitValidation}
              description={text.transactionRules}
              items={[
                text.mustBeIn,
                text.roundedDuration,
                text.insufficientBalanceHint,
              ]}
            />
          </TabsContent>
          ) : null}

          {allowedModes.includes("scout") ? (
          <TabsContent value="scout" className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <Card id="scout" className="bg-[#fffafb]">
              <CardHeader>
                <CardTitle className="text-2xl">{text.memberCardTitle}</CardTitle>
                <CardDescription>
                  {text.memberCardDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    handleOperation(async () => {
                      const readCard = await service.getCard();

                      if (!readCard) {
                        throw new Error("Kartu belum terdaftar.");
                      }

                      return {
                        card: readCard,
                        message: text.readOnlySuccess,
                      };
                    })
                  }
                >
                  <SmartphoneNfc className="h-4 w-4" />
                  {physicalNfc ? text.readPhysicalCard : text.readSimulatedCard}
                </Button>
                <InfoTile label={text.memberId} value={card?.memberId ?? "-"} loading={busy} />
                <InfoTile label={text.name} value={card?.name ?? "-"} loading={busy} />
                <InfoTile
                  label={text.balance}
                  value={card ? formatCurrency(card.balance) : "-"}
                  loading={busy}
                />
                <InfoTile
                  label={text.lastUpdated}
                  value={formatDateTime(card?.lastUpdatedAt ?? 0)}
                  loading={busy}
                />
              </CardContent>
            </Card>
            <TransactionTable card={card} locale={locale} loading={busy} />
          </TabsContent>
          ) : null}
        </Tabs>
      </section>
    </main>
  );
}

function TelkomselMark() {
  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#ed1b2f_0%,#ed1b2f_58%,#ffb000_58%,#ffb000_100%)] text-lg font-black text-white shadow-[0_10px_24px_rgba(237,27,47,0.25)] sm:h-11 sm:w-11 sm:text-xl">
        T
        <span className="absolute -right-1 top-2 h-3 w-3 rounded-full bg-white/90" />
      </div>
      <div className="min-w-0 leading-none">
        <div className="max-w-[150px] truncate text-xl font-black tracking-tight text-primary sm:max-w-none sm:text-3xl">
          MyTelkomsel
        </div>
        <div className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#001a41]/55 sm:text-xs">
          MBC Operator
        </div>
      </div>
    </div>
  );
}

function RoleLoginPanel({
  locale,
  onLogin,
}: {
  locale: AppLocale;
  onLogin: (role: UserRole) => void;
}) {
  const text = uiText[locale];

  return (
    <section id="role-login" className="mx-auto flex max-w-7xl items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <Card className="w-full max-w-5xl bg-[#fffafb] px-1 py-8 sm:px-10 sm:py-10">
        <CardHeader className="gap-4">
          <Badge className="h-8 w-fit rounded-full bg-accent px-4 text-primary">
            {text.roleAccess}
          </Badge>
          <CardTitle className="max-w-3xl text-3xl font-black text-[#001a41] sm:text-5xl">
            {text.roleLoginTitle}
          </CardTitle>
          <CardDescription className="max-w-3xl text-[0.95rem] leading-7 sm:text-base">
            {text.roleLoginDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {roleOptions.map((option) => (
              <a
                key={option.role}
                href={`/?role=${option.role.toLowerCase()}`}
                onClick={() => onLogin(option.role)}
                className="group flex min-h-44 flex-col rounded-[22px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_rgba(237,27,47,0.12)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
                    <RoleIcon role={option.role} />
                  </div>
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-white text-xs text-slate-500">
                    {option.defaultMode}
                  </Badge>
                </div>
                <h2 className="text-xl font-black text-[#001a41]">
                  {roleTitle(option.role, locale)}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {roleDescription(option.role, locale)}
                </p>
                <div className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">
                  {text.enter}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </a>
            ))}
          </div>
          <p className="text-sm leading-6 text-slate-600">
            {text.localSessionNote}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function NfcSupportNotice({
  title,
  message,
  isSimulationActive,
  locale,
}: {
  title: string;
  message: string;
  isSimulationActive: boolean;
  locale: AppLocale;
}) {
  const text = uiText[locale];

  return (
    <Card className="border-white bg-white/95 py-5">
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <SmartphoneNfc className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold text-[#001a41]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {isSimulationActive ? text.simulationActive : text.alternateModeAvailable}
            </div>
            <p className="mt-2 text-sm leading-6 text-emerald-800/80">
              {text.simulationWorks}
            </p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#001a41]">
              <QrCode className="h-4 w-4" />
              {text.nextRecommendation}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {text.qrRecommendation}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NfcIssueDialog({
  title,
  message,
  helper,
  locale,
  onUseSimulation,
  onClose,
}: {
  title: string;
  message: string;
  helper: string;
  locale: AppLocale;
  onUseSimulation: () => void;
  onClose: () => void;
}) {
  const text = uiText[locale];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#001a41]/45 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="nfc-issue-title"
        aria-describedby="nfc-issue-description"
        aria-modal="true"
        className="w-full max-w-lg rounded-[28px] border border-white bg-white p-5 shadow-[0_28px_90px_rgba(0,26,65,0.22)] sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <SmartphoneNfc className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                {text.nfcDialogEyebrow}
              </p>
              <h2 id="nfc-issue-title" className="mt-2 text-xl font-black text-[#001a41]">
                {title}
              </h2>
            </div>
          </div>
          <Button
            aria-label={text.closeDialog}
            className="size-10 shrink-0 border-slate-200 bg-white text-[#001a41]"
            onClick={onClose}
            size="icon"
            variant="outline"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p id="nfc-issue-description" className="mt-4 text-sm leading-6 text-slate-600">
          {message}
        </p>
        <div className="mt-4 rounded-[20px] border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
          {helper}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Button className="h-12" onClick={onUseSimulation}>
            <QrCode className="h-4 w-4" />
            {text.useSimulationMode}
          </Button>
          <Button className="h-12 border-slate-200 bg-white text-[#001a41]" onClick={onClose} variant="outline">
            {text.closeDialog}
          </Button>
        </div>
      </section>
    </div>
  );
}

function RoleIcon({ role }: { role: UserRole }) {
  if (role === "ADMIN") {
    return <CreditCard className="h-5 w-5" />;
  }

  if (role === "GATE") {
    return <DoorOpen className="h-5 w-5" />;
  }

  if (role === "TERMINAL") {
    return <DoorClosed className="h-5 w-5" />;
  }

  return <Eye className="h-5 w-5" />;
}

function LanguageFlag({ locale }: { locale: AppLocale }) {
  if (locale === "en") {
    return (
      <span
        aria-hidden="true"
        className="relative h-5 w-8 overflow-hidden rounded-[6px] bg-[#012169] shadow-inner ring-1 ring-slate-200"
      >
        <span className="absolute left-1/2 top-1/2 h-[34px] w-[5px] -translate-x-1/2 -translate-y-1/2 rotate-[58deg] bg-white" />
        <span className="absolute left-1/2 top-1/2 h-[34px] w-[5px] -translate-x-1/2 -translate-y-1/2 -rotate-[58deg] bg-white" />
        <span className="absolute left-1/2 top-1/2 h-[34px] w-[2px] -translate-x-1/2 -translate-y-1/2 rotate-[58deg] bg-[#c8102e]" />
        <span className="absolute left-1/2 top-1/2 h-[34px] w-[2px] -translate-x-1/2 -translate-y-1/2 -rotate-[58deg] bg-[#c8102e]" />
        <span className="absolute inset-y-0 left-1/2 w-[7px] -translate-x-1/2 bg-white" />
        <span className="absolute inset-x-0 top-1/2 h-[7px] -translate-y-1/2 bg-white" />
        <span className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[#c8102e]" />
        <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-[#c8102e]" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="relative h-5 w-8 overflow-hidden rounded-[6px] bg-white shadow-inner ring-1 ring-slate-200"
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-primary" />
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-white" />
    </span>
  );
}

function FeedbackGlyph({ tone }: { tone: Feedback["tone"] }) {
  if (tone === "success") {
    return <CheckCircle2 className="h-4 w-4" />;
  }

  if (tone === "error") {
    return <AlertTriangle className="h-4 w-4" />;
  }

  return <Info className="h-4 w-4" />;
}

function InfoTile({
  label,
  value,
  loading = false,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-5">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-3 h-5 w-32 rounded-full" />
      ) : (
        <p className="mt-2 break-words text-base font-extrabold text-[#001a41]">{value}</p>
      )}
    </div>
  );
}

function ModeNotes({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card className="bg-[#fffafb]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-[18px] border border-slate-200 bg-white p-4 text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TransactionTable({
  card,
  locale,
  loading = false,
}: {
  card: PlainCardData | null;
  locale: AppLocale;
  loading?: boolean;
}) {
  const text = uiText[locale];

  return (
    <Card className="bg-[#fffafb]">
      <CardHeader>
        <CardTitle>{text.transactionHistory}</CardTitle>
        <CardDescription>{text.transactionHistoryDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{text.type}</TableHead>
              <TableHead>{text.amount}</TableHead>
              <TableHead>{text.time}</TableHead>
              <TableHead>{text.note}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`transaction-skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-36 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : card?.logs.length ? (
              card.logs.map((log) => (
                <TableRow key={`${log.type}-${log.timestamp}`}>
                  <TableCell className="font-medium">{log.type}</TableCell>
                  <TableCell>{log.amount ? formatCurrency(log.amount) : "-"}</TableCell>
                  <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell>{log.note}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  {text.noTransactions}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
