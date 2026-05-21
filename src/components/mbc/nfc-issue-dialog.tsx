import { QrCode, SmartphoneNfc, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { AppLocale } from "./types";
import { uiText } from "./ui-text";

export function NfcIssueDialog({
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
          <Button
            className="h-12 border-slate-200 bg-white text-[#001a41]"
            onClick={onClose}
            variant="outline"
          >
            {text.closeDialog}
          </Button>
        </div>
      </section>
    </div>
  );
}
