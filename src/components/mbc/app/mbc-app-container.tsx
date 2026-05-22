"use client";

import { AppHeader } from "../views/app-header";
import { LoadingShell } from "../views/loading-shell";
import { NfcIssueDialog } from "../views/nfc-issue-dialog";
import { NfcSupportNotice } from "../views/nfc-support-notice";
import { RoleLoginPanel } from "../views/role-login-panel";
import { RoleWorkspace } from "../views/role-workspace";
import { StatusOverview } from "../views/status-overview";
import { useMbcController } from "./use-mbc-controller";

export function MbcApp({ initialRole }: { initialRole?: string | null }) {
  const app = useMbcController(initialRole);

  if (!app.mounted) {
    return <LoadingShell />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fff4f5_24%,#fff9fa_58%,#ffffff_100%)] text-foreground">
      <AppHeader
        activeRole={app.activeRole}
        locale={app.locale}
        onFocusLogin={focusLoginPanel}
        onToggleLocale={app.toggleLocale}
      />

      {app.nfcIssueDialog ? (
        <NfcIssueDialog
          title={app.nfcIssueDialog.title}
          message={app.nfcIssueDialog.message}
          helper={app.nfcIssueDialog.helper ?? app.text.nfcDialogHelp}
          locale={app.locale}
          onUseSimulation={app.activateSimulationMode}
          onClose={() => app.setNfcIssueDialog(null)}
        />
      ) : null}

      {!app.activeRole ? (
        <RoleLoginPanel locale={app.locale} onLogin={app.loginAsRole} />
      ) : null}

      <StatusOverview
        activeRole={app.activeRole}
        busy={app.busy}
        canResetCard={app.canResetCard}
        card={app.card}
        feedback={app.feedback}
        locale={app.locale}
        nfcReadyLabel={app.nfcReadyLabel}
        nfcStatusMessage={app.nfcStatusMessage}
        onClearCard={app.clearCard}
        onPhysicalMode={app.activatePhysicalNfcMode}
        onSimulationMode={app.activateSimulationMode}
        pendingPhysicalWrite={app.pendingPhysicalWrite}
        physicalNfc={app.physicalNfc}
        writePendingPhysicalCard={() => void app.writePendingPhysicalCard()}
      />

      {app.activeRole ? (
        <RoleWorkspace
          allowedModes={app.allowedModes}
          busy={app.busy}
          card={app.card}
          defaultMode={app.roleConfig?.defaultMode ?? "station"}
          handleOperation={(operation) => void app.handleOperation(operation)}
          initialBalance={app.initialBalance}
          locale={app.locale}
          memberId={app.memberId}
          name={app.name}
          physicalNfc={app.physicalNfc}
          regenerateMemberId={app.regenerateMemberId}
          runMutation={app.runMutation}
          securePayload={app.securePayload}
          service={app.service}
          setInitialBalance={app.setInitialBalance}
          setMemberId={app.setMemberId}
          setName={app.setName}
          setSimulatedCheckIn={app.setSimulatedCheckIn}
          setSimulationMode={app.setSimulationMode}
          setTopUpAmount={app.setTopUpAmount}
          showModeTabs={app.showModeTabs}
          simulatedCheckIn={app.simulatedCheckIn}
          simulationMode={app.simulationMode}
          topUpAmount={app.topUpAmount}
        />
      ) : null}

      {!app.webNfcSupported ? (
        <section className={app.activeRole ? "mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8" : "hidden"}>
          <NfcSupportNotice
            title={app.nfcStatusTitle}
            message={app.nfcStatusMessage}
            isSimulationActive={!app.physicalNfc}
            locale={app.locale}
          />
        </section>
      ) : null}
    </main>
  );
}

function focusLoginPanel() {
  document.getElementById("role-login")?.scrollIntoView({ behavior: "smooth" });
}
