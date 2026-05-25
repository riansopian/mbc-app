// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppHeader } from "../app-header";

describe("AppHeader", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("routes login, logout, and language actions correctly", () => {
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
});
