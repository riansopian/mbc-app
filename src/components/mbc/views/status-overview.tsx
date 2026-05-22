import { QrCode, RefreshCcw, ShieldCheck, SmartphoneNfc } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlainCardData } from "@/lib/mbc/types";
import { cn } from "@/lib/utils";

import { buildModeHref } from "../logic/routing";
import { roleTitle } from "../logic/roles";
import { FeedbackGlyph } from "../shared/feedback-glyph";
import { metricItems, statusBadge } from "../shared/status-metrics";
import type { AppLocale, Feedback, UserRole } from "../logic/types";
import { uiText } from "../i18n/ui-text";

export function StatusOverview({
  activeRole,
  busy,
  canResetCard,
  card,
  feedback,
  locale,
  nfcReadyLabel,
  nfcStatusMessage,
  onClearCard,
  onPhysicalMode,
  onSimulationMode,
  pendingPhysicalWrite,
  physicalNfc,
  writePendingPhysicalCard,
}: {
  activeRole: UserRole | null;
  busy: boolean;
  canResetCard: boolean;
  card: PlainCardData | null;
  feedback: Feedback;
  locale: AppLocale;
  nfcReadyLabel: string;
  nfcStatusMessage: string;
  onClearCard: () => void;
  onPhysicalMode: () => void;
  onSimulationMode: () => void;
  pendingPhysicalWrite: PlainCardData | null;
  physicalNfc: boolean;
  writePendingPhysicalCard: () => void;
}) {
  return (
    <section className={activeRole ? "bg-transparent" : "hidden"}>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_380px] lg:items-start">
          <HeroSummary activeRole={activeRole} locale={locale} physicalNfc={physicalNfc} />
          <ModeCard
            activeRole={activeRole}
            canResetCard={canResetCard}
            card={card}
            locale={locale}
            nfcReadyLabel={nfcReadyLabel}
            nfcStatusMessage={nfcStatusMessage}
            onClearCard={onClearCard}
            onPhysicalMode={onPhysicalMode}
            onSimulationMode={onSimulationMode}
            physicalNfc={physicalNfc}
          />
        </div>
        <MetricGrid busy={busy} card={card} locale={locale} />
        <FeedbackAlert feedback={feedback} />
        {physicalNfc && pendingPhysicalWrite ? (
          <PendingWrite
            busy={busy}
            locale={locale}
            onWrite={writePendingPhysicalCard}
          />
        ) : null}
      </div>
    </section>
  );
}

function HeroSummary({
  activeRole,
  locale,
  physicalNfc,
}: {
  activeRole: UserRole | null;
  locale: AppLocale;
  physicalNfc: boolean;
}) {
  const text = uiText[locale];

  return (
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
      <h1 className="text-3xl font-extrabold tracking-normal text-[#001a41] sm:text-5xl">
        {text.headline}
      </h1>
      <p className="mt-3 max-w-3xl text-[0.95rem] leading-7 text-slate-600 sm:text-base">
        {text.intro}
      </p>
    </div>
  );
}

function ModeCard({
  activeRole,
  canResetCard,
  card,
  locale,
  nfcReadyLabel,
  nfcStatusMessage,
  onClearCard,
  onPhysicalMode,
  onSimulationMode,
  physicalNfc,
}: {
  activeRole: UserRole | null;
  canResetCard: boolean;
  card: PlainCardData | null;
  locale: AppLocale;
  nfcReadyLabel: string;
  nfcStatusMessage: string;
  onClearCard: () => void;
  onPhysicalMode: () => void;
  onSimulationMode: () => void;
  physicalNfc: boolean;
}) {
  const text = uiText[locale];

  return (
    <div className="rounded-[28px] border border-white bg-white/90 p-3 shadow-[0_18px_48px_rgba(0,26,65,0.09)]">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{text.cardMode}</p>
          <p className="mt-1 text-sm font-extrabold text-[#001a41]">{nfcReadyLabel}</p>
        </div>
        {statusBadge(card, locale)}
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-[22px] bg-slate-100 p-1.5">
        <ModeLink active={!physicalNfc} href={buildModeHref(activeRole, false)} onClick={onSimulationMode} title={text.simulationTitle}>
          <QrCode className="h-4 w-4" />
          {text.simulation}
        </ModeLink>
        <ModeLink active={physicalNfc} href={buildModeHref(activeRole, true)} onClick={onPhysicalMode} title={nfcStatusMessage}>
          <SmartphoneNfc className="h-4 w-4" />
          {text.nfcPhysical}
        </ModeLink>
      </div>
      {canResetCard ? (
        <Button
          variant="outline"
          className="mt-3 h-11 w-full border-slate-200 bg-white text-[#001a41]"
          onClick={onClearCard}
          title={text.resetCardTitle}
          aria-label={text.resetCardTitle}
        >
          <RefreshCcw className="h-4 w-4" />
          {text.resetCard}
        </Button>
      ) : null}
    </div>
  );
}

function ModeLink({
  active,
  children,
  href,
  onClick,
  title,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={cn(
        "flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-3 py-2 text-center text-sm font-bold transition",
        active ? "bg-primary text-white shadow-[0_12px_24px_rgba(237,27,47,0.22)]" : "bg-transparent text-[#001a41]",
      )}
      title={title}
    >
      {children}
    </a>
  );
}

function MetricGrid({ busy, card, locale }: { busy: boolean; card: PlainCardData | null; locale: AppLocale }) {
  return (
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
  );
}

function FeedbackAlert({ feedback }: { feedback: Feedback }) {
  return (
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
  );
}

function PendingWrite({
  busy,
  locale,
  onWrite,
}: {
  busy: boolean;
  locale: AppLocale;
  onWrite: () => void;
}) {
  const text = uiText[locale];

  return (
    <div className="rounded-[24px] border-2 border-primary bg-white p-4 shadow-[0_18px_44px_rgba(237,27,47,0.16)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-extrabold text-primary">{text.pendingWriteTitle}</p>
          <p className="text-sm font-semibold leading-6 text-[#001a41]">
            {text.pendingWriteMessage}
          </p>
        </div>
        <Button className="h-12 shadow-[0_12px_28px_rgba(237,27,47,0.24)]" disabled={busy} onClick={onWrite}>
          <SmartphoneNfc className="h-4 w-4" />
          {text.writeToNfc}
        </Button>
      </div>
    </div>
  );
}
