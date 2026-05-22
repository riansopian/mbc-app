import { CreditCard, DoorClosed, DoorOpen, Eye } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MembershipCardService } from "@/lib/mbc/service";
import type { OperationResult, PlainCardData } from "@/lib/mbc/types";

import { AdminPanel } from "./admin-panel";
import { GatePanel } from "./gate-panel";
import { MemberPanel } from "./member-panel";
import { TerminalPanel } from "./terminal-panel";
import type { AppLocale, AppMode, MutationRunner } from "../logic/types";
import { uiText } from "../i18n/ui-text";

export function RoleWorkspace({
  allowedModes,
  busy,
  card,
  defaultMode,
  handleOperation,
  initialBalance,
  locale,
  memberId,
  name,
  physicalNfc,
  regenerateMemberId,
  runMutation,
  securePayload,
  service,
  setInitialBalance,
  setMemberId,
  setName,
  setSimulatedCheckIn,
  setSimulationMode,
  setTopUpAmount,
  showModeTabs,
  simulatedCheckIn,
  simulationMode,
  topUpAmount,
}: {
  allowedModes: AppMode[];
  busy: boolean;
  card: PlainCardData | null;
  defaultMode: AppMode;
  handleOperation: (operation: () => Promise<OperationResult>) => void;
  initialBalance: string;
  locale: AppLocale;
  memberId: string;
  name: string;
  physicalNfc: boolean;
  regenerateMemberId: () => void;
  runMutation: MutationRunner;
  securePayload: string;
  service: MembershipCardService;
  setInitialBalance: (value: string) => void;
  setMemberId: (value: string) => void;
  setName: (value: string) => void;
  setSimulatedCheckIn: (value: string) => void;
  setSimulationMode: (value: boolean) => void;
  setTopUpAmount: (value: string) => void;
  showModeTabs: boolean;
  simulatedCheckIn: string;
  simulationMode: boolean;
  topUpAmount: string;
}) {
  const text = uiText[locale];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-6 lg:px-8">
      <Tabs key={defaultMode} defaultValue={defaultMode} className="space-y-6">
        {showModeTabs ? <ModeTabs allowedModes={allowedModes} text={text} /> : null}
        {allowedModes.includes("station") ? (
          <TabsContent value="station">
            <AdminPanel
              busy={busy}
              handleOperation={handleOperation}
              initialBalance={initialBalance}
              memberId={memberId}
              name={name}
              physicalNfc={physicalNfc}
              regenerateMemberId={regenerateMemberId}
              runMutation={runMutation}
              securePayload={securePayload}
              service={service}
              setInitialBalance={setInitialBalance}
              setMemberId={setMemberId}
              setName={setName}
              setTopUpAmount={setTopUpAmount}
              text={text}
              topUpAmount={topUpAmount}
            />
          </TabsContent>
        ) : null}
        {allowedModes.includes("gate") ? (
          <TabsContent value="gate">
            <GatePanel
              busy={busy}
              runMutation={runMutation}
              setSimulatedCheckIn={setSimulatedCheckIn}
              setSimulationMode={setSimulationMode}
              simulatedCheckIn={simulatedCheckIn}
              simulationMode={simulationMode}
              text={text}
            />
          </TabsContent>
        ) : null}
        {allowedModes.includes("terminal") ? (
          <TabsContent value="terminal">
            <TerminalPanel busy={busy} card={card} runMutation={runMutation} text={text} />
          </TabsContent>
        ) : null}
        {allowedModes.includes("scout") ? (
          <TabsContent value="scout">
            <MemberPanel
              busy={busy}
              card={card}
              handleOperation={handleOperation}
              locale={locale}
              physicalNfc={physicalNfc}
              service={service}
              text={text}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </section>
  );
}

function ModeTabs({
  allowedModes,
  text,
}: {
  allowedModes: AppMode[];
  text: typeof uiText.id | typeof uiText.en;
}) {
  return (
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
  );
}
