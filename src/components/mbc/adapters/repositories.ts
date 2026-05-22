import { LocalNfcCardRepository } from "@/lib/mbc/repository";
import { SilentShieldCodec } from "@/lib/mbc/security";
import { MembershipCardService } from "@/lib/mbc/service";
import { MembershipBenefitTariff, SystemClock } from "@/lib/mbc/tariff";
import type { CardRepository, PlainCardData } from "@/lib/mbc/types";
import {
  WebNfcCardRepository,
  type WebNfcCardRepositoryEvents,
} from "@/lib/mbc/web-nfc";

export class DraftCardRepository implements CardRepository {
  constructor(private card: PlainCardData | null) {}

  async read() {
    return this.card ? structuredClone(this.card) : null;
  }

  async write(card: PlainCardData) {
    this.card = structuredClone(card);
  }

  async clear() {
    this.card = null;
  }

  async exportSecurePayload() {
    return null;
  }
}

export function createService(
  usePhysicalNfc: boolean,
  webNfcEvents?: WebNfcCardRepositoryEvents,
) {
  const codec = new SilentShieldCodec();

  return new MembershipCardService(
    usePhysicalNfc
      ? new WebNfcCardRepository(codec, webNfcEvents)
      : new LocalNfcCardRepository(codec),
    new MembershipBenefitTariff(),
    new SystemClock(),
  );
}

export async function readLocalInitialCard() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return await createService(false).getCard();
  } catch {
    return null;
  }
}
