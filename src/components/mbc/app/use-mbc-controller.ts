"use client";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency, toInputDateTime } from "@/lib/mbc/format";
import { SilentShieldCodec } from "@/lib/mbc/security";
import { MembershipCardService } from "@/lib/mbc/service";
import { MembershipBenefitTariff, SystemClock } from "@/lib/mbc/tariff";
import type { OperationResult, PlainCardData } from "@/lib/mbc/types";
import {
  WebNfcCardRepository,
  type WebNfcCardRepositoryEvents,
} from "@/lib/mbc/web-nfc";
import { getErrorMessage, translateErrorMessage, translateFeedbackTitle } from "../logic/errors";
import { getPhysicalNfcIssue } from "../logic/nfc-issues";
import { getNfcStatus } from "../logic/nfc-status";
import { DraftCardRepository, createService, readLocalInitialCard } from "../adapters/repositories";
import { buildModeHref, parseNfcMode, parseRoleValue } from "../logic/routing";
import { roleDescription, roleOptions, roleTitle } from "../logic/roles";
import type { Feedback, NfcIssueDialogContent, UserRole } from "../logic/types";
import { uiText } from "../i18n/ui-text";
export function useMbcController(initialRole?: string | null) {
  const [activeRole, setActiveRole] = useState<UserRole | null>(() =>
    parseRoleValue(initialRole),
  );
  const [card, setCard] = useState<PlainCardData | null>(null);
  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [locale, setLocale] = useState<"id" | "en">("id");
  const [physicalNfc, setPhysicalNfc] = useState(false);
  const [webNfcSupported, setWebNfcSupported] = useState(false);
  const [pendingPhysicalWrite, setPendingPhysicalWrite] = useState<PlainCardData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [nfcStatusTitle, setNfcStatusTitle] = useState("NFC fisik belum dicek");
  const [nfcStatusMessage, setNfcStatusMessage] = useState(
    "NFC fisik membutuhkan Chrome Android dan HTTPS.",
  );
  const [nfcIssueDialog, setNfcIssueDialog] = useState<NfcIssueDialogContent | null>(null);
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
  const securePayload = useMemo(
    () => (card ? JSON.stringify(new SilentShieldCodec().encode(card), null, 2) : ""),
    [card],
  );
  useEffect(() => {
    void Promise.resolve().then(async () => {
      try {
        if ("serviceWorker" in navigator && window.location.protocol === "https:") {
          navigator.serviceWorker.register("/sw.js").catch(() => undefined);
        }
        const storedLocale = window.localStorage.getItem("mbc.locale") === "en" ? "en" : "id";
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
        if (roleFromUrl) setActiveRole(roleFromUrl);
        const storedCard = await readLocalInitialCard();
        if (!nfcStatus.supported) setCard(storedCard);
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
      setFeedback({ tone: "error", title: text.transactionFailed, message: getErrorMessage(error, locale) });
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
      setFeedback({ tone: "error", title: text.resetFailed, message: getErrorMessage(error, locale) });
    } finally {
      setBusy(false);
    }
  }
  async function stagePhysicalOperation(
    operation: (draftService: MembershipCardService) => Promise<OperationResult>,
  ) {
    setBusy(true);
    setFeedback({ tone: "neutral", title: text.readFirstTitle, message: text.readFirstMessage });
    try {
      const sourceCard = await new WebNfcCardRepository(
        new SilentShieldCodec(),
        webNfcEvents,
      ).read();
      const draftService = new MembershipCardService(
        new DraftCardRepository(sourceCard),
        new MembershipBenefitTariff(),
        new SystemClock(),
      );
      const result = await operation(draftService);
      setCard(result.card);
      setFeedback({ tone: "neutral", title: text.updateReadyTitle, message: text.updateReadyMessage });
      await writePhysicalResult(result.card);
    } catch (error) {
      showPhysicalNfcIssue(error);
      const rawMessage = error instanceof Error ? error.message : "Terjadi kesalahan.";
      const isCheckoutStillOut =
        activeRole === "TERMINAL" && rawMessage.includes("Kartu belum check-in");
      setFeedback({
        tone: "error",
        title: text.prepareNfcFailed,
        message: isCheckoutStillOut ? text.checkoutCardStillOut : getErrorMessage(error, locale),
      });
    } finally {
      setBusy(false);
    }
  }
  async function writePhysicalResult(nextCard: PlainCardData) {
    try {
      await new WebNfcCardRepository(new SilentShieldCodec()).write(nextCard);
      setPendingPhysicalWrite(null);
      setFeedback({ tone: "success", title: text.writeNfcSuccess, message: text.writeNfcSuccessMessage });
    } catch (writeError) {
      showPhysicalNfcIssue(writeError);
      setPendingPhysicalWrite(nextCard);
      setFeedback({
        tone: "error",
        title: text.writeNfcFailed,
        message: `${getErrorMessage(writeError, locale)} ${text.pendingWriteMessage}`,
      });
    }
  }
  async function writePendingPhysicalCard() {
    if (!pendingPhysicalWrite) {
      setFeedback({ tone: "error", title: text.noPendingWrite, message: text.prepareFirst });
      return;
    }
    setBusy(true);
    setFeedback({ tone: "neutral", title: text.writeNfcTitle, message: text.writeSameCard });
    try {
      await writePhysicalResult(pendingPhysicalWrite);
      setCard(pendingPhysicalWrite);
    } finally {
      setBusy(false);
    }
  }
  function runMutation(operation: (targetService: MembershipCardService) => Promise<OperationResult>) {
    if (!physicalNfc) {
      void handleOperation(() => operation(service));
      return;
    }
    void stagePhysicalOperation(operation);
  }
  function showPhysicalNfcIssue(error: unknown) {
    if (!physicalNfc) return;
    const issue = getPhysicalNfcIssue({
      error,
      locale,
      nfcStatusMessage,
      nfcStatusTitle,
      webNfcSupported,
    });
    if (issue) setNfcIssueDialog(issue);
  }
  function activateSimulationMode() {
    setPhysicalNfc(false);
    setPendingPhysicalWrite(null);
    setNfcIssueDialog(null);
    window.history.replaceState(null, "", buildModeHref(activeRole, false));
    setFeedback({ tone: "neutral", title: text.simulationActive, message: text.simulationWorks });
  }
  function activatePhysicalNfcMode() {
    setPhysicalNfc(true);
    window.history.replaceState(null, "", buildModeHref(activeRole, true));
    if (!webNfcSupported) {
      const issue = { title: nfcStatusTitle, message: nfcStatusMessage, helper: text.nfcDialogHelp };
      setNfcIssueDialog(issue);
      setFeedback({ tone: "error", title: issue.title, message: issue.message });
    }
  }
  function loginAsRole(role: UserRole) {
    if (!roleOptions.some((option) => option.role === role)) return;
    setActiveRole(role);
    window.history.replaceState(null, "", buildModeHref(role, physicalNfc));
    setFeedback({
      tone: "success",
      title: text.roleActive(roleTitle(role, locale)),
      message: roleDescription(role, locale),
    });
  }
  function toggleLocale() {
    const nextLocale = locale === "id" ? "en" : "id";
    setLocale(nextLocale);
    window.localStorage.setItem("mbc.locale", nextLocale);
    const nfcStatus = getNfcStatus(nextLocale);
    setNfcStatusTitle(nfcStatus.title);
    setNfcStatusMessage(nfcStatus.message);
    setFeedback((current) => ({
      ...current,
      title: translateFeedbackTitle(current.title, nextLocale),
      message: translateErrorMessage(current.message, nextLocale),
    }));
    if (nfcIssueDialog) {
      setNfcIssueDialog({
        title: nfcStatus.title,
        message: nfcStatus.message,
        helper: uiText[nextLocale].nfcDialogHelp,
      });
    }
  }
  return {
    activeRole, allowedModes, busy, card, clearCard, feedback, handleOperation,
    initialBalance, locale, loginAsRole, memberId, mounted, name, nfcIssueDialog,
    nfcStatusMessage, nfcStatusTitle, pendingPhysicalWrite, physicalNfc,
    roleConfig, runMutation, securePayload, service, setInitialBalance, setMemberId,
    setName, setNfcIssueDialog, setSimulatedCheckIn, setSimulationMode,
    setTopUpAmount, simulatedCheckIn, simulationMode, text, toggleLocale, topUpAmount,
    webNfcSupported, activatePhysicalNfcMode, activateSimulationMode,
    canResetCard: activeRole === "ADMIN",
    nfcReadyLabel: webNfcSupported ? text.nfcReady : text.simulationRecommended,
    showModeTabs: allowedModes.length > 1,
    writePendingPhysicalCard,
  };
}
