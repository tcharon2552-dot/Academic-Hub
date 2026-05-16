import { describe, expect, it } from "vitest";
import { OwnerType, PaymentMethod, PaymentStatus, PlanCode } from "@prisma/client";
import {
  PaymentError,
  createCheckoutOrder,
  listPaymentOrders,
  type PaymentClient,
  type PaymentOrderResult
} from "../../src/lib/payments";

type PaymentOrderRow = PaymentOrderResult;

function createPaymentClient(rows: PaymentOrderRow[] = []): PaymentClient & { rows: PaymentOrderRow[] } {
  const client: PaymentClient & { rows: PaymentOrderRow[] } = {
    rows,
    paymentOrder: {
      create: async ({ data }) => {
        const order = {
          id: `payment-order-${rows.length + 1}`,
          userId: data.userId ?? null,
          teamId: data.teamId ?? null,
          ownerType: data.ownerType,
          ownerId: data.ownerId,
          ownerLabel: data.ownerLabel ?? null,
          planCode: data.planCode ?? null,
          method: data.method,
          status: data.status ?? PaymentStatus.PENDING,
          amountCents: data.amountCents,
          currency: data.currency ?? "RMB",
          paymentProvider: data.paymentProvider ?? null,
          providerOrderId: data.providerOrderId ?? null,
          metadata: data.metadata ?? null
        } satisfies PaymentOrderRow;
        rows.push(order);
        return order;
      },
      findMany: async () => rows
    }
  };

  return client;
}

describe("payment checkout", () => {
  it("stores self-serve checkout orders in E2E mode without a database", async () => {
    const previousMode = process.env.ACADEMIC_HUB_E2E_MODE;
    process.env.ACADEMIC_HUB_E2E_MODE = "true";

    try {
      await expect(
        createCheckoutOrder({
          ownerType: OwnerType.USER,
          ownerId: "e2e:buyer@example.com",
          userId: "e2e:buyer@example.com",
          planCode: PlanCode.A2,
          method: PaymentMethod.ALIPAY
        })
      ).resolves.toMatchObject({
        id: "e2e-payment-order-1",
        ownerId: "e2e:buyer@example.com",
        planCode: PlanCode.A2,
        method: PaymentMethod.ALIPAY,
        status: PaymentStatus.PENDING,
        amountCents: 6900
      });

      await expect(
        listPaymentOrders({
          ownerType: OwnerType.USER,
          ownerId: "e2e:buyer@example.com"
        })
      ).resolves.toEqual([
        expect.objectContaining({
          id: "e2e-payment-order-1",
          planCode: PlanCode.A2,
          method: PaymentMethod.ALIPAY
        })
      ]);
    } finally {
      if (previousMode === undefined) {
        delete process.env.ACADEMIC_HUB_E2E_MODE;
      } else {
        process.env.ACADEMIC_HUB_E2E_MODE = previousMode;
      }
    }
  });

  it("creates self-serve checkout orders for A1, A2, A3, and B1", async () => {
    const client = createPaymentClient();

    for (const planCode of [PlanCode.A1, PlanCode.A2, PlanCode.A3, PlanCode.B1]) {
      await expect(
        createCheckoutOrder(
          {
            ownerType: OwnerType.USER,
            ownerId: `owner-${planCode}`,
            planCode,
            method: PaymentMethod.ALIPAY
          },
          {
            client
          }
        )
      ).resolves.toMatchObject({
        status: PaymentStatus.PENDING,
        method: PaymentMethod.ALIPAY,
        planCode,
        paymentProvider: "manual-alipay"
      });
    }

    expect(client.rows).toHaveLength(4);
    expect(client.rows.map((row) => row.amountCents)).toEqual([1900, 6900, 19900, 29900]);
  });

  it("creates domestic WeChat Pay orders for self-serve checkout", async () => {
    const client = createPaymentClient();

    await expect(
      createCheckoutOrder(
        {
          ownerType: OwnerType.USER,
          ownerId: "user-1",
          planCode: PlanCode.A2,
          method: PaymentMethod.WECHAT_PAY
        },
        {
          client
        }
      )
    ).resolves.toMatchObject({
      status: PaymentStatus.PENDING,
      method: PaymentMethod.WECHAT_PAY,
      paymentProvider: "manual-wechat-pay"
    });
  });

  it("rejects B2 and B3 checkout with an application path", async () => {
    const client = createPaymentClient();

    await expect(
      createCheckoutOrder(
        {
          ownerType: OwnerType.TEAM,
          ownerId: "team-1",
          planCode: PlanCode.B2,
          method: PaymentMethod.BANK_TRANSFER
        },
        {
          client
        }
      )
    ).rejects.toMatchObject({
      name: "PaymentError",
      applicationHref: "/apply/team"
    } satisfies Partial<PaymentError>);
    expect(client.rows).toHaveLength(0);
  });

  it("creates bank transfer orders for team plans", async () => {
    const client = createPaymentClient();

    await expect(
      createCheckoutOrder(
        {
          ownerType: OwnerType.TEAM,
          ownerId: "team-1",
          ownerLabel: "Computational Biology Lab",
          teamId: "team-1",
          planCode: PlanCode.B1,
          method: PaymentMethod.BANK_TRANSFER
        },
        {
          client
        }
      )
    ).resolves.toMatchObject({
      ownerType: OwnerType.TEAM,
      ownerId: "team-1",
      teamId: "team-1",
      ownerLabel: "Computational Biology Lab",
      paymentProvider: "manual-bank-transfer",
      status: PaymentStatus.UNDER_REVIEW,
      metadata: {
        instructions: expect.stringContaining("bank transfer")
      }
    });
  });

  it("keeps crypto payments disabled by default", async () => {
    const client = createPaymentClient();

    await expect(
      createCheckoutOrder(
        {
          ownerType: OwnerType.USER,
          ownerId: "user-1",
          planCode: PlanCode.A2,
          method: PaymentMethod.CRYPTO_USDT
        },
        {
          client,
          cryptoEnabled: false
        }
      )
    ).rejects.toMatchObject({
      name: "PaymentError",
      code: "CRYPTO_DISABLED"
    } satisfies Partial<PaymentError>);
    expect(client.rows).toHaveLength(0);
  });

  it("creates manual-review USDT orders when crypto payments are enabled", async () => {
    const client = createPaymentClient();

    await expect(
      createCheckoutOrder(
        {
          ownerType: OwnerType.USER,
          ownerId: "user-1",
          planCode: PlanCode.A2,
          method: PaymentMethod.CRYPTO_USDT
        },
        {
          client,
          cryptoEnabled: true
        }
      )
    ).resolves.toMatchObject({
      status: PaymentStatus.PENDING,
      method: PaymentMethod.CRYPTO_USDT,
      paymentProvider: "crypto-usdt-manual-review"
    });
  });
});
