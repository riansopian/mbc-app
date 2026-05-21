import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/mbc/format";
import type { PlainCardData } from "@/lib/mbc/types";

import type { AppLocale } from "./types";
import { uiText } from "./ui-text";

export function TransactionTable({
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
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-2xl">{text.transactionHistory}</CardTitle>
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
              <LoadingRows />
            ) : card?.logs.length ? (
              card.logs.map((log) => (
                <TableRow key={`${log.type}-${log.timestamp}`}>
                  <TableCell className="font-bold">{log.type}</TableCell>
                  <TableCell>{log.amount ? formatCurrency(log.amount) : "-"}</TableCell>
                  <TableCell>{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell>{log.note}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-slate-500">
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

function LoadingRows() {
  return Array.from({ length: 3 }).map((_, index) => (
    <TableRow key={index}>
      <TableCell>
        <Skeleton className="h-4 w-20 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-36 rounded-full" />
      </TableCell>
    </TableRow>
  ));
}
