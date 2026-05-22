import { CheckCircle2, QrCode, SmartphoneNfc } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { AppLocale } from "../logic/types";
import { uiText } from "../i18n/ui-text";

export function NfcSupportNotice({
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
