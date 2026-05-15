import { Prisma } from "@prisma/client";
import { db } from "./db";
import { PLAN_CATALOG } from "./plans";

export const QUOTA_TYPES = {
  researchTask: "research_task_credits",
  paperReading: "paper_reading_credits",
  longDocument: "long_document_credits",
  advancedModel: "advanced_model_credits"
} as const;

export type QuotaType = (typeof QUOTA_TYPES)[keyof typeof QUOTA_TYPES];
export type OwnerType = "USER" | "TEAM";
export type QuotaEventType =
  | "SIGNUP_GRANT"
  | "PLAN_GRANT"
  | "CONSUMPTION"
  | "ADD_ON_GRANT"
  | "ADJUSTMENT"
  | "EXPIRATION";

type LedgerWhere = {
  ownerType: OwnerType;
  ownerId: string;
  quotaType: QuotaType;
  OR?: Array<
    | {
        expiresAt: null;
      }
    | {
        expiresAt: {
          gt: Date;
        };
      }
  >;
};

type LedgerCreateInput = LedgerWhere & {
  eventType: QuotaEventType;
  amount: number;
  balanceAfter?: number | null;
  expiresAt?: Date | null;
  idempotencyKey?: string | null;
  metadata?: Prisma.InputJsonValue;
};

type TransactionOptions = {
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

export type QuotaClient = {
  quotaLedger: {
    aggregate(args: {
      where: LedgerWhere;
      _sum: {
        amount: true;
      };
    }): Promise<{
      _sum: {
        amount: number | null;
      };
    }>;
    create(args: { data: LedgerCreateInput }): Promise<unknown>;
    createMany(args: { data: LedgerCreateInput[]; skipDuplicates?: boolean }): Promise<{ count: number }>;
  };
  $transaction<T>(callback: (tx: QuotaClient) => Promise<T>, options?: TransactionOptions): Promise<T>;
};

type QuotaOptions = {
  client?: QuotaClient;
  ownerType?: OwnerType;
};

const prismaQuotaClient: QuotaClient = {
  quotaLedger: {
    aggregate: (args) => db.quotaLedger.aggregate(args),
    create: (args) => db.quotaLedger.create(args),
    createMany: (args) => db.quotaLedger.createMany(args)
  },
  $transaction: (callback, options) => db.$transaction((tx) => callback(tx as unknown as QuotaClient), options)
};

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

async function getBalance(
  client: QuotaClient,
  ownerId: string,
  quotaType: QuotaType,
  ownerType: OwnerType
) {
  const now = new Date();
  const result = await client.quotaLedger.aggregate({
    where: {
      ownerType,
      ownerId,
      quotaType,
      OR: [
        {
          expiresAt: null
        },
        {
          expiresAt: {
            gt: now
          }
        }
      ]
    },
    _sum: {
      amount: true
    }
  });

  return result._sum.amount ?? 0;
}

export async function getQuotaBalance(
  ownerId: string,
  quotaType: QuotaType,
  options: QuotaOptions = {}
) {
  return getBalance(options.client ?? prismaQuotaClient, ownerId, quotaType, options.ownerType ?? "USER");
}

function isPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError
    ? error.code === code
    : typeof error === "object" && error !== null && "code" in error && error.code === code;
}

async function withSerializableRetry<T>(client: QuotaClient, callback: (tx: QuotaClient) => Promise<T>) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await client.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      });
    } catch (error) {
      if (isPrismaError(error, "P2034") && attempt < maxAttempts) {
        continue;
      }

      throw error;
    }
  }

  throw new QuotaError("Quota transaction retry limit exceeded.");
}

export async function grantSignupCredits(ownerId: string, options: QuotaOptions = {}) {
  const client = options.client ?? prismaQuotaClient;
  const ownerType = options.ownerType ?? "USER";
  const signupPlan = PLAN_CATALOG.find((plan) => plan.code === "A0");

  if (!signupPlan) {
    throw new QuotaError("A0 signup plan is not configured.");
  }

  const entries = [
    [QUOTA_TYPES.researchTask, signupPlan.quotaDefaults.researchTaskCredits],
    [QUOTA_TYPES.paperReading, signupPlan.quotaDefaults.paperReadingCredits],
    [QUOTA_TYPES.longDocument, signupPlan.quotaDefaults.longDocumentCredits],
    [QUOTA_TYPES.advancedModel, signupPlan.quotaDefaults.advancedModelCredits]
  ] as const;

  await withSerializableRetry(client, async (tx) => {
    const data: LedgerCreateInput[] = [];

    for (const [quotaType, amount] of entries) {
      if (amount <= 0) {
        continue;
      }

      const currentBalance = await getBalance(tx, ownerId, quotaType, ownerType);

      data.push({
        ownerType,
        ownerId,
        eventType: "SIGNUP_GRANT",
        quotaType,
        amount,
        balanceAfter: currentBalance + amount,
        idempotencyKey: `signup:${ownerType}:${ownerId}:${quotaType}`
      });
    }

    if (data.length > 0) {
      await tx.quotaLedger.createMany({
        data,
        skipDuplicates: true
      });
    }
  });
}

export async function consumeQuota(
  ownerId: string,
  quotaType: QuotaType,
  amount: number,
  metadata?: Prisma.InputJsonValue,
  options: QuotaOptions = {}
) {
  if (amount <= 0) {
    throw new QuotaError("Quota consumption amount must be greater than zero.");
  }

  const client = options.client ?? prismaQuotaClient;
  const ownerType = options.ownerType ?? "USER";

  await withSerializableRetry(client, async (tx) => {
    const currentBalance = await getBalance(tx, ownerId, quotaType, ownerType);

    if (currentBalance < amount) {
      throw new QuotaError(`Insufficient ${quotaType}. Required ${amount}, available ${currentBalance}.`);
    }

    await tx.quotaLedger.create({
      data: {
        ownerType,
        ownerId,
        eventType: "CONSUMPTION",
        quotaType,
        amount: -amount,
        balanceAfter: currentBalance - amount,
        metadata
      }
    });
  });
}

export async function grantAddOnQuota(
  ownerId: string,
  quotaType: QuotaType,
  amount: number,
  expiresAt?: Date | null,
  options: QuotaOptions = {}
) {
  if (amount <= 0) {
    throw new QuotaError("Add-on quota amount must be greater than zero.");
  }

  const client = options.client ?? prismaQuotaClient;
  const ownerType = options.ownerType ?? "USER";

  await client.$transaction(async (tx) => {
    const currentBalance = await getBalance(tx, ownerId, quotaType, ownerType);

    await tx.quotaLedger.create({
      data: {
        ownerType,
        ownerId,
        eventType: "ADD_ON_GRANT",
        quotaType,
        amount,
        balanceAfter: currentBalance + amount,
        expiresAt
      }
    });
  });
}
