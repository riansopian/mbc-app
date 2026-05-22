// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { MembershipCardService } from "@/lib/mbc/service";
import type { OperationResult, PlainCardData } from "@/lib/mbc/types";

import { AdminPanel } from "../admin-panel";
import { AppHeader } from "../app-header";
import { NfcIssueDialog } from "../nfc-issue-dialog";
import { RoleLoginPanel } from "../role-login-panel";
import { uiText } from "../../i18n/ui-text";

const sampleCard: PlainCardData = {
  memberId: "MBC001",
  name: "Anggota",
  balance: 50_000,
  visitStatus: "OUT",
  checkInTimestamp: 0,
  lastUpdatedAt: 1_000,
  revision: 1,
  cardNonce: "nonce",
  logs: [],
};

describe("MBC focused components", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("lets the user choose every PRD role from the login panel", () => {
    const onLogin = vi.fn();

    render(<RoleLoginPanel locale="en" onLogin={onLogin} />);

    expect(screen.getByText("Choose user role")).toBeInTheDocument();
    expect(screen.getByText("Cooperative Admin")).toBeInTheDocument();
    expect(screen.getByText("Entry Gate Officer")).toBeInTheDocument();
    expect(screen.getByText("Exit Gate Officer")).toBeInTheDocument();
    expect(screen.getByText("Cooperative Member")).toBeInTheDocument();

    const terminalLink = screen.getByText("Exit Gate Officer").closest("a")!;
    terminalLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(terminalLink);

    expect(onLogin).toHaveBeenCalledWith("TERMINAL");
  });

  it("routes header login, logout, and language actions correctly", () => {
    const onFocusLogin = vi.fn();
    const onToggleLocale = vi.fn();

    const { rerender } = render(
      <AppHeader
        activeRole={null}
        locale="id"
        onFocusLogin={onFocusLogin}
        onToggleLocale={onToggleLocale}
      />,
    );

    fireEvent.click(screen.getByRole("link", { name: /login/i }));
    expect(onFocusLogin).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Ganti bahasa ke English US" }));
    expect(onToggleLocale).toHaveBeenCalledTimes(1);

    rerender(
      <AppHeader
        activeRole="ADMIN"
        locale="en"
        onFocusLogin={onFocusLogin}
        onToggleLocale={onToggleLocale}
      />,
    );

    const logoutLink = screen.getByRole("link", { name: /logout/i });
    expect(logoutLink).toHaveAttribute("href", "/");
    fireEvent.click(logoutLink);
    expect(onFocusLogin).toHaveBeenCalledTimes(1);
  });

  it("supports closing the NFC issue dialog and switching to simulation", () => {
    const onUseSimulation = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <NfcIssueDialog
        title="Browser does not support NFC yet"
        message="Use Chrome Android."
        helper="Simulation is still available."
        locale="en"
        onUseSimulation={onUseSimulation}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "Browser does not support NFC yet",
    );

    fireEvent.click(screen.getByRole("button", { name: "Use simulation" }));
    expect(onUseSimulation).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[1]);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(container.firstElementChild!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("submits admin registration, top-up, quick top-up, and reset actions", async () => {
    const registerResult = Promise.resolve({
      card: sampleCard,
      message: "registered",
    });
    const service = {
      register: vi.fn(() => registerResult),
    } as unknown as MembershipCardService;
    const handleOperation = vi.fn((operation: () => Promise<OperationResult>) => {
      void operation();
    });
    const runMutation = vi.fn();
    const regenerateMemberId = vi.fn();
    const setInitialBalance = vi.fn();
    const setMemberId = vi.fn();
    const setName = vi.fn();
    const setTopUpAmount = vi.fn();

    render(
      <AdminPanel
        busy={false}
        handleOperation={handleOperation}
        initialBalance=""
        memberId=""
        name=""
        physicalNfc={false}
        regenerateMemberId={regenerateMemberId}
        runMutation={runMutation}
        securePayload=""
        service={service}
        setInitialBalance={setInitialBalance}
        setMemberId={setMemberId}
        setName={setName}
        setTopUpAmount={setTopUpAmount}
        text={uiText.id}
        topUpAmount="25000"
      />,
    );

    fireEvent.change(screen.getByLabelText("ID Anggota"), {
      target: { value: "MBC777" },
    });
    fireEvent.change(screen.getByLabelText("Nama"), {
      target: { value: "Rian" },
    });
    fireEvent.change(screen.getByLabelText("Saldo awal"), {
      target: { value: "50000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate ID" }));
    fireEvent.click(screen.getByRole("button", { name: /simpan kartu simulasi/i }));

    expect(setMemberId).toHaveBeenCalledWith("MBC777");
    expect(setName).toHaveBeenCalledWith("Rian");
    expect(setInitialBalance).toHaveBeenCalledWith("50000");
    expect(regenerateMemberId).toHaveBeenCalledTimes(1);
    expect(handleOperation).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(service.register).toHaveBeenCalledWith("", "", NaN));

    fireEvent.click(screen.getByRole("button", { name: "Isi saldo" }));
    fireEvent.click(screen.getByRole("button", { name: /10\.000/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reset status keluar" }));

    expect(runMutation).toHaveBeenCalledTimes(3);
  });

  it("shows physical NFC wording and loading encrypted data state", () => {
    render(
      <AdminPanel
        busy
        handleOperation={vi.fn()}
        initialBalance="1000"
        memberId="MBC001"
        name="Anggota"
        physicalNfc
        regenerateMemberId={vi.fn()}
        runMutation={vi.fn()}
        securePayload="secret"
        service={{} as MembershipCardService}
        setInitialBalance={vi.fn()}
        setMemberId={vi.fn()}
        setName={vi.fn()}
        setTopUpAmount={vi.fn()}
        text={uiText.en}
        topUpAmount=""
      />,
    );

    expect(screen.getByRole("button", { name: /save to nfc card/i })).toBeDisabled();
    expect(screen.getByPlaceholderText("Reading card...")).toBeInTheDocument();
  });
});
