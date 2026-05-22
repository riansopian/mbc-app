// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import type { PlainCardData } from "@/lib/mbc/types";

import { DraftCardRepository, createService, readLocalInitialCard } from "../repositories";

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

describe("MBC card repository adapters", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("keeps draft repository data isolated from caller mutation", async () => {
    const repository = new DraftCardRepository(sampleCard);
    const firstRead = await repository.read();

    firstRead!.name = "Changed outside";

    expect((await repository.read())!.name).toBe("Anggota");

    await repository.write({ ...sampleCard, name: "Updated" });
    expect((await repository.read())!.name).toBe("Updated");

    await repository.clear();
    expect(await repository.read()).toBeNull();
    expect(await repository.exportSecurePayload()).toBeNull();
  });

  it("creates local services and ignores invalid initial local storage", async () => {
    const service = createService(false);

    expect(await service.getCard()).toBeNull();

    window.localStorage.setItem("mbc.simulated.nfc-card", "{broken-json");

    await expect(readLocalInitialCard()).resolves.toBeNull();
  });
});
