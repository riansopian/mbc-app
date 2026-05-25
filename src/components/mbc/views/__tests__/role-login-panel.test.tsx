// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RoleLoginPanel } from "../role-login-panel";

describe("RoleLoginPanel", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("lets the user choose every PRD role", () => {
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
});
