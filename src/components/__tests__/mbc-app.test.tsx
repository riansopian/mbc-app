// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MbcApp } from "../mbc-app";

function renderRole(role: string) {
  window.localStorage.clear();
  window.history.replaceState(null, "", `/?role=${role}`);

  return render(<MbcApp initialRole={role} />);
}

describe("MbcApp role UI", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("shows only registration and top-up features for Admin Koperasi", async () => {
    renderRole("admin");

    await waitFor(() =>
      expect(screen.getAllByText("Admin Koperasi").length).toBeGreaterThan(0),
    );

    expect(screen.getByText("Daftarkan kartu baru, isi saldo, dan reset status kunjungan.")).toBeInTheDocument();
    expect(screen.queryByText("Pintu Masuk")).not.toBeInTheDocument();
    expect(screen.queryByText("Pintu Keluar")).not.toBeInTheDocument();
    expect(screen.queryByText("Kartu Anggota")).not.toBeInTheDocument();
  });

  it("shows only check-in features for Petugas Pintu Masuk", async () => {
    renderRole("gate");

    await waitFor(() => expect(screen.getByText("Pintu Masuk")).toBeInTheDocument());

    expect(screen.getByRole("button", { name: /Check-in/i })).toBeInTheDocument();
    expect(screen.queryByText("Admin Koperasi")).not.toBeInTheDocument();
    expect(screen.queryByText("Pintu Keluar")).not.toBeInTheDocument();
    expect(screen.queryByText("Kartu Anggota")).not.toBeInTheDocument();
  });

  it("shows only checkout and charge features for Petugas Pintu Keluar", async () => {
    renderRole("terminal");

    await waitFor(() => expect(screen.getByText("Pintu Keluar")).toBeInTheDocument());

    expect(screen.getByText("Check-out dan potong saldo")).toBeInTheDocument();
    expect(screen.queryByText("Admin Koperasi")).not.toBeInTheDocument();
    expect(screen.queryByText("Pintu Masuk")).not.toBeInTheDocument();
    expect(screen.queryByText("Kartu Anggota")).not.toBeInTheDocument();
  });

  it("shows only read-only card features for Anggota Koperasi", async () => {
    renderRole("member");

    await waitFor(() => expect(screen.getByText("Kartu Anggota")).toBeInTheDocument());

    expect(screen.getByText("Baca kartu simulasi")).toBeInTheDocument();
    expect(screen.queryByText("Admin Koperasi")).not.toBeInTheDocument();
    expect(screen.queryByText("Pintu Masuk")).not.toBeInTheDocument();
    expect(screen.queryByText("Pintu Keluar")).not.toBeInTheDocument();
  });

  it("switches interface language to English US from the header button", async () => {
    renderRole("admin");

    await waitFor(() =>
      expect(screen.getAllByText("Admin Koperasi").length).toBeGreaterThan(0),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Ganti bahasa ke English US" }),
    );

    expect(screen.getByRole("button", { name: "Switch language to Bahasa Indonesia" })).toBeInTheDocument();
    expect(screen.getByText("Card mode")).toBeInTheDocument();
    expect(screen.getAllByText("Cooperative Admin").length).toBeGreaterThan(0);
    expect(screen.getByText("Save simulated card")).toBeInTheDocument();
  });
});
