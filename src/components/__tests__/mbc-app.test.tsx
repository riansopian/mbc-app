// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SilentShieldCodec } from "@/lib/mbc/security";
import { MbcApp } from "../mbc-app";

const MBC_MIME_TYPE = "application/vnd.mbc.card+json";

function toDataView(value: string) {
  const bytes = new TextEncoder().encode(value);

  return new DataView(bytes.buffer);
}

function renderRole(role: string) {
  window.localStorage.clear();
  window.history.replaceState(null, "", `/?role=${role}`);

  return render(<MbcApp initialRole={role} />);
}

describe("MbcApp role UI", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(window, "NDEFReader", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });
  });

  it("shows only registration and top-up features for Admin Koperasi", async () => {
    renderRole("admin");

    await waitFor(() =>
      expect(screen.getAllByText("Admin Koperasi").length).toBeGreaterThan(0),
    );

    expect(screen.getByText("Daftarkan kartu baru, isi saldo, dan reset status kunjungan.")).toBeInTheDocument();
    expect(screen.getByLabelText("ID Anggota")).toHaveAttribute("placeholder", "MBC001");
    expect(screen.getByLabelText("Nama")).toHaveAttribute("placeholder", "Anggota Koperasi");
    expect(screen.getByLabelText("Saldo awal")).toHaveAttribute("placeholder", "50000");
    await waitFor(() =>
      expect((screen.getByLabelText("ID Anggota") as HTMLInputElement).value).toMatch(
        /^MBC-\d{6}-\d{4}$/,
      ),
    );
    expect((screen.getByLabelText("Saldo awal") as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
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

  it("translates transaction feedback when switching to English", async () => {
    renderRole("member");

    await waitFor(() => expect(screen.getByText("Kartu Anggota")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Baca kartu simulasi" }));

    await waitFor(() => expect(screen.getByText("Transaksi gagal")).toBeInTheDocument());
    expect(screen.getByText("Kartu belum terdaftar.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ganti bahasa ke English US" }));

    expect(screen.getByText("Transaction failed")).toBeInTheDocument();
    expect(screen.getByText("Card is not registered yet.")).toBeInTheDocument();
    expect(screen.queryByText("Transaksi gagal")).not.toBeInTheDocument();
  });

  it("shows a popup when physical NFC mode is selected on an unsupported browser", async () => {
    renderRole("admin");

    await waitFor(() =>
      expect(screen.getAllByText("Admin Koperasi").length).toBeGreaterThan(0),
    );

    fireEvent.click(screen.getByRole("link", { name: /NFC Fisik/i }));

    expect(screen.getByRole("dialog", { name: /NFC fisik membutuhkan HTTPS/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pakai simulasi" })).toBeInTheDocument();
  });

  it("shows the unsupported NFC popup when physical mode is opened from the URL", async () => {
    window.localStorage.clear();
    window.history.replaceState(null, "", "/?role=admin&nfc=physical");

    render(<MbcApp initialRole="admin" />);

    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /NFC fisik membutuhkan HTTPS/i })).toBeInTheDocument(),
    );
  });

  it("explains that physical check-in must be written before checkout", async () => {
    const outCardPayload = JSON.stringify(
      new SilentShieldCodec().encode({
        memberId: "MBC001",
        name: "Anggota Koperasi",
        balance: 50_000,
        visitStatus: "OUT",
        checkInTimestamp: 0,
        lastUpdatedAt: 1_000,
        revision: 1,
        cardNonce: "nonce",
        logs: [],
      }),
    );

    class MockNdefReader extends EventTarget {
      async scan() {
        queueMicrotask(() => {
          this.dispatchEvent(
            Object.assign(new Event("reading"), {
              serialNumber: "04-TEST",
              message: {
                records: [
                  {
                    recordType: "mime",
                    mediaType: MBC_MIME_TYPE,
                    data: toDataView(outCardPayload),
                  },
                ],
              },
            }),
          );
        });
      }

      async write() {}
    }

    Object.defineProperty(window, "NDEFReader", {
      configurable: true,
      value: MockNdefReader,
    });
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    window.localStorage.clear();
    window.history.replaceState(null, "", "/?role=terminal&nfc=physical");

    render(<MbcApp initialRole="terminal" />);

    await waitFor(() => expect(screen.getByText("Pintu Keluar")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Check-out dan potong saldo/i }));

    await waitFor(() =>
      expect(screen.getByText(/Kemungkinan check-in sebelumnya belum ditulis ke kartu/i)).toBeInTheDocument(),
    );
  });

  it("automatically writes physical NFC updates after reading a card", async () => {
    const outCardPayload = JSON.stringify(
      new SilentShieldCodec().encode({
        memberId: "MBC001",
        name: "Anggota Koperasi",
        balance: 50_000,
        visitStatus: "OUT",
        checkInTimestamp: 0,
        lastUpdatedAt: 1_000,
        revision: 1,
        cardNonce: "nonce",
        logs: [],
      }),
    );
    const writtenMessages: Array<{
      records: Array<{ recordType: string; mediaType?: string; data: BufferSource }>;
    }> = [];

    class MockNdefReader extends EventTarget {
      async scan() {
        queueMicrotask(() => {
          this.dispatchEvent(
            Object.assign(new Event("reading"), {
              serialNumber: "04-TEST",
              message: {
                records: [
                  {
                    recordType: "mime",
                    mediaType: MBC_MIME_TYPE,
                    data: toDataView(outCardPayload),
                  },
                ],
              },
            }),
          );
        });
      }

      async write(message: {
        records: Array<{ recordType: string; mediaType?: string; data: BufferSource }>;
      }) {
        writtenMessages.push(message);
      }
    }

    Object.defineProperty(window, "NDEFReader", {
      configurable: true,
      value: MockNdefReader,
    });
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    window.localStorage.clear();
    window.history.replaceState(null, "", "/?role=gate&nfc=physical");

    render(<MbcApp initialRole="gate" />);

    await waitFor(() => expect(screen.getByText("Pintu Masuk")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Check-in/i }));

    await waitFor(() =>
      expect(screen.getByText("Kartu NFC berhasil disimpan")).toBeInTheDocument(),
    );
    expect(writtenMessages).toHaveLength(1);
    expect(writtenMessages[0].records[0]).toMatchObject({
      recordType: "mime",
      mediaType: MBC_MIME_TYPE,
    });
  });
});
