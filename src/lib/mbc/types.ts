export type VisitStatus = "IN" | "OUT";

export type TransactionType = "REGISTER" | "TOPUP" | "CHECKIN" | "CHECKOUT" | "RESET";

export interface TransactionLog {
  type: TransactionType;
  amount: number;
  timestamp: number;
  note: string;
}

export interface PlainCardData {
  memberId: string;
  name: string;
  balance: number;
  visitStatus: VisitStatus;
  checkInTimestamp: number;
  lastUpdatedAt: number;
  revision: number;
  cardNonce: string;
  logs: TransactionLog[];
}

export interface SecureCardPayload {
  version: 1 | 2;
  encodedData: string;
  checksum: string;
  algorithm?: "AES";
}

export interface OperationResult {
  card: PlainCardData;
  message: string;
  fee?: number;
  durationHours?: number;
}

export interface CardRepository {
  read(): Promise<PlainCardData | null>;
  write(card: PlainCardData): Promise<void>;
  clear(): Promise<void>;
  exportSecurePayload(): Promise<SecureCardPayload | null>;
}

export interface CardCodec {
  encode(card: PlainCardData): SecureCardPayload;
  decode(payload: SecureCardPayload): PlainCardData;
}

export interface Clock {
  now(): number;
}

export interface TariffPolicy {
  calculateFee(checkInTimestamp: number, checkOutTimestamp: number): {
    fee: number;
    durationHours: number;
  };
}
