import { ScanLine } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";

import { ModeNotes } from "../shared/mode-notes";
import type { MutationRunner } from "../logic/types";
import { uiText } from "../i18n/ui-text";

export function GatePanel({
  busy,
  runMutation,
  setSimulatedCheckIn,
  setSimulationMode,
  simulatedCheckIn,
  simulationMode,
  text,
}: {
  busy: boolean;
  runMutation: MutationRunner;
  setSimulatedCheckIn: (value: string) => void;
  setSimulationMode: (value: boolean) => void;
  simulatedCheckIn: string;
  simulationMode: boolean;
  text: typeof uiText.id | typeof uiText.en;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1fr]">
      <Card id="gate" className="bg-[#fffafb]">
        <CardHeader>
          <CardTitle className="text-2xl">{text.entryTitle}</CardTitle>
          <CardDescription>{text.entryDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-white p-5">
            <div className="space-y-1">
              <Label htmlFor="simulation-mode">{text.simulationTimeMode}</Label>
              <p className="text-sm text-slate-500">{text.simulationTimeHelp}</p>
            </div>
            <Switch
              id="simulation-mode"
              checked={simulationMode}
              disabled={busy}
              onCheckedChange={setSimulationMode}
            />
          </div>
          {simulationMode ? (
            <div className="space-y-2">
              <Label htmlFor="checkin-time">{text.checkInTime}</Label>
              <Input
                id="checkin-time"
                type="datetime-local"
                value={simulatedCheckIn}
                onChange={(event) => setSimulatedCheckIn(event.target.value)}
              />
            </div>
          ) : null}
          <Button
            size="lg"
            className="h-14 w-full"
            disabled={busy}
            onClick={() =>
              runMutation((targetService) =>
                targetService.checkIn(
                  simulationMode ? new Date(simulatedCheckIn).getTime() : undefined,
                ),
              )
            }
          >
            <ScanLine className="h-5 w-5" />
            {busy ? text.readingCard : text.checkIn}
          </Button>
        </CardContent>
      </Card>
      <ModeNotes
        title={text.entryValidation}
        description={text.transactionRules}
        items={[text.mustBeRegistered, text.mustBeOut, text.repeatedCheckInRejected]}
      />
    </div>
  );
}
