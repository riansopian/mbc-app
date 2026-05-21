import { Clock3, History, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/mbc/format";
import type { PlainCardData } from "@/lib/mbc/types";

import type { AppLocale } from "./types";
import { uiText } from "./ui-text";

export function statusBadge(card: PlainCardData | null, locale: AppLocale) {
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

export function metricItems(card: PlainCardData | null, locale: AppLocale) {
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
      icon: Clock3,
    },
    {
      label: text.checkIn,
      value: card?.checkInTimestamp ? new Date(card.checkInTimestamp).toLocaleTimeString("id-ID") : "-",
      icon: Clock3,
    },
    {
      label: text.savedLogs,
      value: `${card?.logs.length ?? 0}/5`,
      icon: History,
    },
  ];
}
