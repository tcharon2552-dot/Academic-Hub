import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import {
  consumeQuota,
  getQuotaBalance,
  grantAddOnQuota,
  grantSignupCredits,
  QUOTA_TYPES,
  QuotaError,
  type QuotaClient
} from "../../src/lib/quota";

type LedgerRow = {
  ownerType: "USER" | "TEAM";
  ownerId: string;
  eventType:
    | "SIGNUP_GRANT"
    | "PLAN_GRANT"
    | "CONSUMPTION"
    | "ADD_ON_GRANT"
    | "ADJUSTMENT"
    | "EXPIRATION";
  quotaType: string;
  amount: number;
  balanceAfter: number | null;
  expiresAt?: Date | null;
  idempotencyKey?: string | null;
  metadata?: Prisma.InputJsonValue;
};

type LedgerWhereInput = {
  ownerType?: LedgerRow["ownerType"];
  ownerId?: string;
  eventType?: LedgerRow["eventType"];
  quotaType?: string;
  idempotencyKey?: string | null;
  expiresAt?: null | {
    gt?: Date;
  };
  OR?: LedgerWhereInput[];
};

type TransactionOptions = {
  isolationLevel?: Prisma.TransactionIsolationLevel;
};

type TestQuotaClient = QuotaClient & {
  rows: LedgerRow[];
  transactionOptions: TransactionOptions[];
  failNextTransactions(count: number): void;
};

function matchesWhere(row: LedgerRow, where: LedgerWhereInput): boolean {
  if (where.OR && !where.OR.some((condition) => matchesWhere(row, condition))) {
    return false;
  }

  if (where.ownerType && row.ownerType !== where.ownerType) {
    return false;
  }

  if (where.ownerId && row.ownerId !== where.ownerId) {
    return false;
  }

  if (where.eventType && row.eventType !== where.eventType) {
    return false;
  }

  if (where.quotaType && row.quotaType !== where.quotaType) {
    return false;
  }

  if (where.idempotencyKey !== undefined && row.idempotencyKey !== where.idempotencyKey) {
    return false;
  }

  if (where.expiresAt === null && row.expiresAt !== null && row.expiresAt !== undefined) {
    return false;
  }

  if (where.expiresAt && "gt" in where.expiresAt) {
    if (!row.expiresAt || !where.expiresAt.gt || row.expiresAt <= where.expiresAt.gt) {
      return false;
    }
  }

  return true;
}

function createPrismaError(code: string) {
  return Object.assign(new Error(code), { code });
}

function createQuotaClient(rows: LedgerRow[] = []): TestQuotaClient {
  let transactionFailures = 0;

  const client: TestQuotaClient = {
    rows,
    transactionOptions: [],
    failNextTransactions: (count) => {
      transactionFailures = count;
    },
    quotaLedger: {
      aggregate: async ({ where }) => ({
        _sum: {
          amount: rows
            .filter((row) => matchesWhere(row, where as LedgerWhereInput))
            .reduce((sum, row) => sum + row.amount, 0)
        }
      }),
      create: async ({ data }) => {
        if (data.idempotencyKey && rows.some((row) => row.idempotencyKey === data.idempotencyKey)) {
          throw createPrismaError("P2002");
        }

        rows.push({
          ownerType: data.ownerType,
          ownerId: data.ownerId,
          eventType: data.eventType,
          quotaType: data.quotaType,
          amount: data.amount,
          balanceAfter: data.balanceAfter ?? null,
          expiresAt: data.expiresAt ?? null,
          idempotencyKey: data.idempotencyKey ?? null,
          metadata: data.metadata
        });
      },
      createMany: async ({ data, skipDuplicates }) => {
        let count = 0;

        for (const entry of data) {
          if (entry.idempotencyKey && rows.some((row) => row.idempotencyKey === entry.idempotencyKey)) {
            if (skipDuplicates) {
              continue;
            }

            throw createPrismaError("P2002");
          }

          rows.push({
            ownerType: entry.ownerType,
            ownerId: entry.ownerId,
            eventType: entry.eventType,
            quotaType: entry.quotaType,
            amount: entry.amount,
            balanceAfter: entry.balanceAfter ?? null,
            expiresAt: entry.expiresAt ?? null,
            idempotencyKey: entry.idempotencyKey ?? null,
            metadata: entry.metadata
          });
          count += 1;
        }

        return { count };
      }
    },
    $transaction: async (callback, options) => {
      client.transactionOptions.push(options ?? {});

      if (transactionFailures > 0) {
        transactionFailures -= 1;
        throw createPrismaError("P2034");
      }

      return callback(client);
    }
  };

  return client;
}

describe("quota ledger", () => {
  it("grants A0 signup credits", async () => {
    const client = createQuotaClient();

    await grantSignupCredits("user-1", { client });

    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client })).resolves.toBe(30);
    expect(client.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "SIGNUP_GRANT",
          quotaType: QUOTA_TYPES.researchTask,
          amount: 30
        })
      ])
    );
  });

  it("does not grant signup credits more than once for the same owner", async () => {
    const client = createQuotaClient();

    await grantSignupCredits("user-1", { client });
    await grantSignupCredits("user-1", { client });

    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client })).resolves.toBe(30);
    expect(client.rows.filter((row) => row.eventType === "SIGNUP_GRANT")).toHaveLength(3);
  });

  it("consumes quota and creates a debit event", async () => {
    const client = createQuotaClient();
    await grantAddOnQuota("user-1", QUOTA_TYPES.researchTask, 10, null, { client });

    await consumeQuota("user-1", QUOTA_TYPES.researchTask, 4, { workflowRunId: "run-1" }, { client });

    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client })).resolves.toBe(6);
    expect(client.rows.at(-1)).toMatchObject({
      eventType: "CONSUMPTION",
      quotaType: QUOTA_TYPES.researchTask,
      amount: -4,
      balanceAfter: 6,
      metadata: { workflowRunId: "run-1" }
    });
  });

  it("uses serializable transactions and retries serialization conflicts when consuming quota", async () => {
    const client = createQuotaClient();
    await grantAddOnQuota("user-1", QUOTA_TYPES.researchTask, 10, null, { client });
    client.failNextTransactions(1);

    await consumeQuota("user-1", QUOTA_TYPES.researchTask, 4, undefined, { client });

    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client })).resolves.toBe(6);
    expect(client.transactionOptions.at(-2)?.isolationLevel).toBe(Prisma.TransactionIsolationLevel.Serializable);
    expect(client.transactionOptions.at(-1)?.isolationLevel).toBe(Prisma.TransactionIsolationLevel.Serializable);
  });

  it("rejects consumption when quota is insufficient", async () => {
    const client = createQuotaClient();
    await grantAddOnQuota("user-1", QUOTA_TYPES.researchTask, 2, null, { client });

    await expect(
      consumeQuota("user-1", QUOTA_TYPES.researchTask, 3, undefined, { client })
    ).rejects.toBeInstanceOf(QuotaError);

    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client })).resolves.toBe(2);
  });

  it("increases available quota with add-on grants", async () => {
    const client = createQuotaClient();

    await grantAddOnQuota("user-1", QUOTA_TYPES.longDocument, 5, null, { client });
    await grantAddOnQuota("user-1", QUOTA_TYPES.longDocument, 7, null, { client });

    await expect(getQuotaBalance("user-1", QUOTA_TYPES.longDocument, { client })).resolves.toBe(12);
  });

  it("excludes expired grants from available quota", async () => {
    const client = createQuotaClient();

    await grantAddOnQuota("user-1", QUOTA_TYPES.researchTask, 8, new Date("2024-01-01T00:00:00.000Z"), {
      client
    });
    await grantAddOnQuota("user-1", QUOTA_TYPES.researchTask, 5, new Date("2099-01-01T00:00:00.000Z"), {
      client
    });

    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client })).resolves.toBe(5);
  });

  it("tracks advanced model credits separately from research task credits", async () => {
    const client = createQuotaClient();

    await grantAddOnQuota("user-1", QUOTA_TYPES.researchTask, 20, null, { client });
    await grantAddOnQuota("user-1", QUOTA_TYPES.advancedModel, 3, null, { client });
    await consumeQuota("user-1", QUOTA_TYPES.advancedModel, 1, undefined, { client });

    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client })).resolves.toBe(20);
    await expect(getQuotaBalance("user-1", QUOTA_TYPES.advancedModel, { client })).resolves.toBe(2);
  });
});
