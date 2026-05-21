import { ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/mbc/format";
import type { PlainCardData } from "@/lib/mbc/types";

import { InfoTile } from "./info-tile";
import { ModeNotes } from "./mode-notes";
import type { MutationRunner } from "./types";
import { uiText } from "./ui-text";

export function TerminalPanel({
  busy,
  card,
  runMutation,
  text,
}: {
  busy: boolean;
  card: PlainCardData | null;
  runMutation: MutationRunner;
  text: typeof uiText.id | typeof uiText.en;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1fr]">
      <Card className="bg-[#fffafb]">
        <CardHeader>
          <CardTitle className="text-2xl">{text.exitTitle}</CardTitle>
          <CardDescription>{text.exitDescription}</CardDescription>
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
        items={[text.mustBeIn, text.roundedDuration, text.insufficientBalanceHint]}
      />
    </div>
  );
}
