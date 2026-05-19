import type {
  CardRepository,
  Clock,
  OperationResult,
  PlainCardData,
  TariffPolicy,
  TransactionLog,
} from "./types";

const MAX_LOGS = 5;
const SIMULATION_CLOCK_DRIFT_MS = 60 * 1000;

function addLog(card: PlainCardData, log: TransactionLog): PlainCardData {
  return {
    ...card,
    lastUpdatedAt: log.timestamp,
    revision: (card.revision ?? 0) + 1,
    logs: [log, ...card.logs].slice(0, MAX_LOGS),
  };
}

function assertRegistered(card: PlainCardData | null): asserts card is PlainCardData {
  if (!card) {
    throw new Error("Kartu belum terdaftar. Daftarkan kartu melalui menu Admin Koperasi.");
  }
}

export class MembershipCardService {
  private operationLock: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly repository: CardRepository,
    private readonly tariffPolicy: TariffPolicy,
    private readonly clock: Clock,
  ) {}

  getCard() {
    return this.repository.read();
  }

  private async runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const previousOperation = this.operationLock;
    let releaseLock!: () => void;

    this.operationLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await previousOperation;

    try {
      return await operation();
    } finally {
      releaseLock();
    }
  }

  async register(
    memberId: string,
    name: string,
    initialBalance: number,
  ): Promise<OperationResult> {
    return this.runExclusive(async () => {
    if (!memberId.trim() || !name.trim()) {
      throw new Error("Member ID dan nama wajib diisi.");
    }

    if (!Number.isFinite(initialBalance) || initialBalance < 0) {
      throw new Error("Saldo awal tidak boleh negatif.");
    }

    const timestamp = this.clock.now();
    const card = addLog(
      {
        memberId: memberId.trim(),
        name: name.trim(),
        balance: initialBalance,
        visitStatus: "OUT",
        checkInTimestamp: 0,
        lastUpdatedAt: timestamp,
        revision: 0,
        cardNonce: crypto.randomUUID?.() ?? `${timestamp}-${Math.random()}`,
        logs: [],
      },
      {
        type: "REGISTER",
        amount: initialBalance,
        timestamp,
        note: "Kartu anggota dibuat",
      },
    );

    await this.repository.write(card);

    return { card, message: "Kartu anggota berhasil diregistrasi." };
    });
  }

  async topUp(amount: number): Promise<OperationResult> {
    return this.runExclusive(async () => {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Nominal isi saldo harus lebih dari 0.");
    }

    const card = await this.repository.read();
    assertRegistered(card);

    const timestamp = this.clock.now();
    const updatedCard = addLog(
      {
        ...card,
        balance: card.balance + amount,
      },
      {
        type: "TOPUP",
        amount,
        timestamp,
        note: "Saldo kartu ditambahkan",
      },
    );

    await this.repository.write(updatedCard);

    return { card: updatedCard, message: "Isi saldo berhasil." };
    });
  }

  async checkIn(checkInTimestamp?: number): Promise<OperationResult> {
    return this.runExclusive(async () => {
    const card = await this.repository.read();
    assertRegistered(card);

    if (card.visitStatus === "IN") {
      throw new Error("Kartu sudah dalam status masuk. Check-in ulang tidak diperbolehkan.");
    }

    const timestamp = checkInTimestamp ?? this.clock.now();
    const now = this.clock.now();

    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      throw new Error("Waktu check-in tidak valid.");
    }

    if (timestamp > now + SIMULATION_CLOCK_DRIFT_MS) {
      throw new Error("Waktu check-in tidak boleh melebihi waktu saat ini.");
    }

    const updatedCard = addLog(
      {
        ...card,
        visitStatus: "IN",
        checkInTimestamp: timestamp,
      },
      {
        type: "CHECKIN",
        amount: 0,
        timestamp,
        note: "Anggota check-in di pintu masuk",
      },
    );

    await this.repository.write(updatedCard);

    return { card: updatedCard, message: "Check-in berhasil. Status kartu menjadi masuk." };
    });
  }

  async checkOut(): Promise<OperationResult> {
    return this.runExclusive(async () => {
    const card = await this.repository.read();
    assertRegistered(card);

    if (card.visitStatus === "OUT") {
      throw new Error("Kartu belum check-in. Check-out tidak dapat dilakukan.");
    }

    const timestamp = this.clock.now();
    const { fee, durationHours } = this.tariffPolicy.calculateFee(
      card.checkInTimestamp,
      timestamp,
    );

    if (card.balance < fee) {
      throw new Error(
        `Saldo tidak cukup. Biaya Rp${fee.toLocaleString("id-ID")}; arahkan anggota ke Admin Koperasi untuk isi saldo.`,
      );
    }

    const updatedCard = addLog(
      {
        ...card,
        balance: card.balance - fee,
        visitStatus: "OUT",
        checkInTimestamp: 0,
      },
      {
        type: "CHECKOUT",
        amount: fee,
        timestamp,
        note: `Kunjungan ${durationHours} jam`,
      },
    );

    await this.repository.write(updatedCard);

    return {
      card: updatedCard,
      message: "Check-out berhasil. Saldo sudah dipotong.",
      fee,
      durationHours,
    };
    });
  }

  async resetVisitStatus(): Promise<OperationResult> {
    return this.runExclusive(async () => {
    const card = await this.repository.read();
    assertRegistered(card);

    const timestamp = this.clock.now();
    const updatedCard = addLog(
      {
        ...card,
        visitStatus: "OUT",
        checkInTimestamp: 0,
      },
      {
        type: "RESET",
        amount: 0,
        timestamp,
        note: "Status kunjungan direset oleh admin",
      },
    );

    await this.repository.write(updatedCard);

    return { card: updatedCard, message: "Status kartu kembali OUT." };
    });
  }

  async clearCard() {
    await this.runExclusive(async () => {
      await this.repository.clear();
    });
  }
}
