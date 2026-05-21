import { SmartphoneNfc } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/mbc/format";
import type { MembershipCardService } from "@/lib/mbc/service";
import type { OperationResult, PlainCardData } from "@/lib/mbc/types";

import { InfoTile } from "./info-tile";
import { TransactionTable } from "./transaction-table";
import type { AppLocale } from "./types";
import { uiText } from "./ui-text";

export function MemberPanel({
  busy,
  card,
  handleOperation,
  locale,
  physicalNfc,
  service,
  text,
}: {
  busy: boolean;
  card: PlainCardData | null;
  handleOperation: (operation: () => Promise<OperationResult>) => void;
  locale: AppLocale;
  physicalNfc: boolean;
  service: MembershipCardService;
  text: typeof uiText.id | typeof uiText.en;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <Card id="scout" className="bg-[#fffafb]">
        <CardHeader>
          <CardTitle className="text-2xl">{text.memberCardTitle}</CardTitle>
          <CardDescription>{text.memberCardDescription}</CardDescription>
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
    </div>
  );
}
