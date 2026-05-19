// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import { LocalNfcCardRepository } from "../repository";
import { SilentShieldCodec } from "../security";
import type { PlainCardData } from "../types";

const card: PlainCardData = {
  memberId: "MBC001",
  name: "Anggota Koperasi",
  balance: 50_000,
  visitStatus: "OUT",
  checkInTimestamp: 0,
  lastUpdatedAt: 1_000,
  revision: 1,
  cardNonce: "nonce",
  logs: [],
};

describe("LocalNfcCardRepository", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("persists encrypted card data in localStorage", async () => {
    const repository = new LocalNfcCardRepository(new SilentShieldCodec());

    await repository.write(card);

    expect(window.localStorage.getItem("mbc.simulated.nfc-card")).not.toContain(
      card.name,
    );
    await expect(repository.read()).resolves.toEqual(card);
  });

  it("clears simulated card data", async () => {
    const repository = new LocalNfcCardRepository(new SilentShieldCodec());

    await repository.write(card);
    await repository.clear();

    await expect(repository.read()).resolves.toBeNull();
  });
});
