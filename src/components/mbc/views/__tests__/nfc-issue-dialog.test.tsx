// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NfcIssueDialog } from "../nfc-issue-dialog";

describe("NfcIssueDialog", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("supports closing and switching to simulation", () => {
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
});
