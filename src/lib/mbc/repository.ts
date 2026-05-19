import type { CardCodec, CardRepository, PlainCardData, SecureCardPayload } from "./types";

const STORAGE_KEY = "mbc.simulated.nfc-card";

export class LocalNfcCardRepository implements CardRepository {
  constructor(private readonly codec: CardCodec) {}

  async read(): Promise<PlainCardData | null> {
    const rawPayload = window.localStorage.getItem(STORAGE_KEY);

    if (!rawPayload) {
      return null;
    }

    return this.codec.decode(JSON.parse(rawPayload) as SecureCardPayload);
  }

  async write(card: PlainCardData): Promise<void> {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.codec.encode(card)));
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  async exportSecurePayload(): Promise<SecureCardPayload | null> {
    const card = await this.read();

    return card ? this.codec.encode(card) : null;
  }
}
