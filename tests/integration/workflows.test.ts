import { describe, expect, it } from "vitest";
import { OwnerType, PlanCode, Prisma, SubscriptionStatus } from "@prisma/client";
import { getQuotaBalance, QUOTA_TYPES, type QuotaClient } from "../../src/lib/quota";
import { registerUser, type AuthClient } from "../../src/lib/auth";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
};

type SubscriptionRow = {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  planCode: PlanCode;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
};

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
  quotaType?: string;
  expiresAt?: null | {
    gt?: Date;
  };
  OR?: LedgerWhereInput[];
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

  if (where.quotaType && row.quotaType !== where.quotaType) {
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

function createAuthClient(rows: { users: UserRow[]; subscriptions: SubscriptionRow[] }): AuthClient {
  return {
    user: {
      upsert: async ({ where, update, create }) => {
        const existing = rows.users.find((user) => user.email === where.email);

        if (existing) {
          if ("name" in update) {
            existing.name = update.name as string | null;
          }

          return existing;
        }

        const user = {
          id: `user-${rows.users.length + 1}`,
          email: create.email,
          name: create.name ?? null
        };
        rows.users.push(user);
        return user;
      },
      findUnique: async ({ where }) => rows.users.find((user) => user.id === where.id) ?? null
    },
    subscription: {
      upsert: async ({ where, create }) => {
        const key = where.ownerType_ownerId;
        const existing = rows.subscriptions.find(
          (subscription) => subscription.ownerType === key?.ownerType && subscription.ownerId === key.ownerId
        );

        if (existing) {
          return existing;
        }

        const subscription = {
          id: `subscription-${rows.subscriptions.length + 1}`,
          ownerType: create.ownerType,
          ownerId: create.ownerId,
          planCode: create.planCode,
          status: create.status ?? SubscriptionStatus.ACTIVE,
          currentPeriodStart: create.currentPeriodStart as Date,
          currentPeriodEnd: create.currentPeriodEnd ?? null
        } satisfies SubscriptionRow;
        rows.subscriptions.push(subscription);
        return subscription;
      },
      findUnique: async ({ where }) => {
        const key = where.ownerType_ownerId;
        return (
          rows.subscriptions.find(
            (subscription) => subscription.ownerType === key?.ownerType && subscription.ownerId === key.ownerId
          ) ?? null
        );
      }
    }
  };
}

function createQuotaClient(rows: LedgerRow[] = []): QuotaClient & { rows: LedgerRow[] } {
  const client: QuotaClient & { rows: LedgerRow[] } = {
    rows,
    quotaLedger: {
      aggregate: async ({ where }) => ({
        _sum: {
          amount: rows
            .filter((row) => matchesWhere(row, where as LedgerWhereInput))
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

            throw Object.assign(new Error("P2002"), { code: "P2002" });
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
    $transaction: async (callback) => callback(client)
  };

  return client;
}

describe("registration workflow", () => {
  it("creates a user, A0 subscription, and signup quota grant", async () => {
    const authRows = {
      users: [] as UserRow[],
      subscriptions: [] as SubscriptionRow[]
    };
    const authClient = createAuthClient(authRows);
    const quotaClient = createQuotaClient();

    const result = await registerUser(
      {
        email: " Researcher@Example.COM ",
        name: "Dr. Lin"
      },
      {
        client: authClient,
        quotaClient,
        now: () => new Date("2026-05-15T00:00:00.000Z")
      }
    );

    expect(result.user).toMatchObject({
      id: "user-1",
      email: "researcher@example.com",
      name: "Dr. Lin"
    });
    expect(authRows.users).toHaveLength(1);
    expect(authRows.subscriptions).toEqual([
      expect.objectContaining({
        ownerType: "USER",
        ownerId: "user-1",
        planCode: "A0",
        status: "ACTIVE",
        currentPeriodStart: new Date("2026-05-15T00:00:00.000Z")
      })
    ]);
    expect(quotaClient.rows.filter((row) => row.eventType === "SIGNUP_GRANT")).toHaveLength(3);
    await expect(getQuotaBalance(result.user.id, QUOTA_TYPES.researchTask, { client: quotaClient })).resolves.toBe(
      30
    );
    await expect(getQuotaBalance(result.user.id, QUOTA_TYPES.paperReading, { client: quotaClient })).resolves.toBe(5);
    await expect(getQuotaBalance(result.user.id, QUOTA_TYPES.advancedModel, { client: quotaClient })).resolves.toBe(
      2
    );
  });

  it("keeps repeated registration idempotent for free credits", async () => {
    const authRows = {
      users: [] as UserRow[],
      subscriptions: [] as SubscriptionRow[]
    };
    const authClient = createAuthClient(authRows);
    const quotaClient = createQuotaClient();

    await registerUser({ email: "researcher@example.com" }, { client: authClient, quotaClient });
    await registerUser({ email: "researcher@example.com" }, { client: authClient, quotaClient });

    expect(authRows.users).toHaveLength(1);
    expect(authRows.subscriptions).toHaveLength(1);
    expect(quotaClient.rows.filter((row) => row.eventType === "SIGNUP_GRANT")).toHaveLength(3);
    await expect(getQuotaBalance("user-1", QUOTA_TYPES.researchTask, { client: quotaClient })).resolves.toBe(30);
  });
});
