import { Banknote, KeyRound } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/mbc/format";
import type { MembershipCardService } from "@/lib/mbc/service";
import type { OperationResult } from "@/lib/mbc/types";

import { parseAmountInput } from "./routing";
import type { MutationRunner } from "./types";
import { uiText } from "./ui-text";

const quickTopUps = [10000, 25000, 50000];

export function AdminPanel({
  busy,
  handleOperation,
  initialBalance,
  memberId,
  name,
  physicalNfc,
  runMutation,
  securePayload,
  service,
  setInitialBalance,
  setMemberId,
  setName,
  setTopUpAmount,
  text,
  topUpAmount,
}: {
  busy: boolean;
  handleOperation: (operation: () => Promise<OperationResult>) => void;
  initialBalance: string;
  memberId: string;
  name: string;
  physicalNfc: boolean;
  runMutation: MutationRunner;
  securePayload: string;
  service: MembershipCardService;
  setInitialBalance: (value: string) => void;
  setMemberId: (value: string) => void;
  setName: (value: string) => void;
  setTopUpAmount: (value: string) => void;
  text: typeof uiText.id | typeof uiText.en;
  topUpAmount: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <Card id="station" className="bg-[#fffafb]">
        <CardHeader>
          <CardTitle className="text-2xl">{text.adminTitle}</CardTitle>
          <CardDescription>{text.adminDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="member-id" label={text.memberId}>
              <Input
                id="member-id"
                value={memberId}
                placeholder={text.memberIdPlaceholder}
                onChange={(event) => setMemberId(event.target.value)}
              />
            </Field>
            <Field id="member-name" label={text.name}>
              <Input
                id="member-name"
                value={name}
                placeholder={text.namePlaceholder}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field id="initial-balance" label={text.initialBalance}>
              <Input
                id="initial-balance"
                type="number"
                min={0}
                value={initialBalance}
                placeholder={text.initialBalancePlaceholder}
                onChange={(event) => setInitialBalance(event.target.value)}
              />
            </Field>
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
            <Field id="topup" label={text.topUpBalance}>
              <Input
                id="topup"
                type="number"
                min={1}
                value={topUpAmount}
                placeholder={text.topUpPlaceholder}
                onChange={(event) => setTopUpAmount(event.target.value)}
              />
            </Field>
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
              onClick={() => runMutation((targetService) => targetService.resetVisitStatus())}
            >
              {text.resetOut}
            </Button>
          </div>
        </CardContent>
      </Card>
      <EncryptedDataCard busy={busy} securePayload={securePayload} text={text} />
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function EncryptedDataCard({
  busy,
  securePayload,
  text,
}: {
  busy: boolean;
  securePayload: string;
  text: typeof uiText.id | typeof uiText.en;
}) {
  return (
    <Card className="bg-[#fffafb]">
      <CardHeader>
        <CardTitle className="text-2xl">{text.encryptedData}</CardTitle>
        <CardDescription>{text.encryptedDescription}</CardDescription>
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
  );
}
