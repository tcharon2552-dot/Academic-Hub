import { describe, expect, it } from "vitest";
import type { Prisma } from "@prisma/client";
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
  metadata?: Prisma.InputJsonValue;
};

function createQuotaClient(rows: LedgerRow[] = []): QuotaClient & { rows: LedgerRow[] } {
  const client: QuotaClient & { rows: LedgerRow[] } = {
    rows,
    quotaLedger: {
      aggregate: async ({ where }) => ({
        _sum: {
          amount: rows
            .filter((row) => {
              const notExpired = !row.expiresAt || row.expiresAt > new Date();

              return (
                row.ownerType === where.ownerType &&
                row.ownerId === where.ownerId &&
                row.quotaType === where.quotaType &&
                notExpired
              );
            })
            .reduce((sum, row) => sum + row.amount, 0)
        }
      }),
      create: async ({ data }) => {
        rows.push({
          ownerType: data.ownerType,
          ownerId: data.ownerId,
          eventType: data.eventType,
          quotaType: data.quotaType,
          amount: data.amount,
          balanceAfter: data.balanceAfter ?? null,
          expiresAt: data.expiresAt ?? null,
          metadata: data.metadata
        });
      }
    },
    $transaction: async (callback) => callback(client)
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

  it("tracks advanced model credits separately from research task credits", async () => {
    const client = createQuotaClient();

    await grantAddOnQuota("user-1", QUOTA_TYPES.researchTask, 20, null, { client });
    await grantAddOnQuota("user-1", QUOTA_TYPES.advancedModel, 3, null, { client });
    await consumeQuota("user-1", QUOTA_TYPES.advancedModel, 1, undefined, { client });

    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client })).resolves.toBe(20);
    await expect(getQuotaBalance("user-1", QUOTA_TYPES.advancedModel, { client })).resolves.toBe(2);
  });
});
