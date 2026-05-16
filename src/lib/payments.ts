import { OwnerType, PaymentMethod, PaymentStatus, PlanCode, type Prisma } from "@prisma/client";
import { db } from "./db";
import { isE2eMode } from "./e2e-mode";
import { getPlanByCode } from "./plans";
import { checkoutInputSchema, type CheckoutInput } from "./validators/billing";

type PaymentOrderCreateArgs = {
  data: {
    userId?: string | null;
    teamId?: string | null;
    ownerType: OwnerType;
    ownerId: string;
    ownerLabel?: string | null;
    planCode?: PlanCode | null;
    method: PaymentMethod;
    status?: PaymentStatus;
    amountCents: number;
    currency?: string;
    paymentProvider?: string | null;
    providerOrderId?: string | null;
    metadata?: Prisma.InputJsonValue | null;
  };
};

export type PaymentOrderResult = {
  id: string;
  userId: string | null;
  teamId: string | null;
  ownerType: OwnerType;
  ownerId: string;
  ownerLabel: string | null;
  planCode: PlanCode | null;
  method: PaymentMethod;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  paymentProvider: string | null;
  providerOrderId: string | null;
  metadata: Prisma.JsonValue | Prisma.InputJsonValue | null;
};

export type PaymentClient = {
  paymentOrder: {
    create(args: PaymentOrderCreateArgs): Promise<PaymentOrderResult>;
    findMany(args?: {
      where?: {
        ownerType?: OwnerType;
        ownerId?: string;
      };
      orderBy?: {
        createdAt: "asc" | "desc";
      };
      take?: number;
    }): Promise<PaymentOrderResult[]>;
  };
};

export type PaymentProviderResult = {
  provider: string;
  status: PaymentStatus;
  providerOrderId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export type PaymentProvider = {
  createPayment(input: CheckoutInput): Promise<PaymentProviderResult>;
};

export class PaymentError extends Error {
  code?: string;
  applicationHref?: string;

  constructor(message: string, options: { code?: string; applicationHref?: string } = {}) {
    super(message);
    this.name = "PaymentError";
    this.code = options.code;
    this.applicationHref = options.applicationHref;
  }
}

export class ManualBankTransferProvider implements PaymentProvider {
  async createPayment(input: CheckoutInput): Promise<PaymentProviderResult> {
    return {
      provider: "manual-bank-transfer",
      status: PaymentStatus.UNDER_REVIEW,
      metadata: {
        instructions: `Create a bank transfer order for ${input.ownerLabel ?? input.ownerId}. Finance reviews payment manually.`
      }
    };
  }
}

export class DisabledCryptoProvider implements PaymentProvider {
  async createPayment(): Promise<PaymentProviderResult> {
    throw new PaymentError("Crypto payments are disabled by default and require compliance review.", {
      code: "CRYPTO_DISABLED"
    });
  }
}

class ManualDomesticProvider implements PaymentProvider {
  constructor(private readonly provider: string) {}

  async createPayment(): Promise<PaymentProviderResult> {
    return {
      provider: this.provider,
      status: PaymentStatus.PENDING
    };
  }
}

const selfServePlans = new Set<PlanCode>([PlanCode.A1, PlanCode.A2, PlanCode.A3, PlanCode.B1]);
const applicationPlans = new Set<PlanCode>([PlanCode.B2, PlanCode.B3]);

const prismaPaymentClient: PaymentClient = {
  paymentOrder: {
    create: (args) => db.paymentOrder.create(args as Prisma.PaymentOrderCreateArgs),
    findMany: (args) => db.paymentOrder.findMany(args as Prisma.PaymentOrderFindManyArgs)
  }
};

const e2ePaymentRows: PaymentOrderResult[] = [];

const e2ePaymentClient: PaymentClient = {
  paymentOrder: {
    create: async ({ data }) => {
      const order = {
        id: `e2e-payment-order-${e2ePaymentRows.length + 1}`,
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
      } satisfies PaymentOrderResult;
      e2ePaymentRows.unshift(order);
      return order;
    },
    findMany: async (args) => {
      const ownerType = args?.where?.ownerType;
      const ownerId = args?.where?.ownerId;
      const rows = e2ePaymentRows.filter((order) => {
        if (ownerType && order.ownerType !== ownerType) {
          return false;
        }

        if (ownerId && order.ownerId !== ownerId) {
          return false;
        }

        return true;
      });

      return typeof args?.take === "number" ? rows.slice(0, args.take) : rows;
    }
  }
};

function getPaymentClient(client?: PaymentClient) {
  if (client) {
    return client;
  }

  return isE2eMode() ? e2ePaymentClient : prismaPaymentClient;
}

function resolveAmountCents(planCode: PlanCode) {
  const plan = getPlanByCode(planCode);
  return plan.pricing.monthlyPriceMin * 100;
}

function resolveProvider(method: PaymentMethod, cryptoEnabled: boolean): PaymentProvider {
  if (method === PaymentMethod.BANK_TRANSFER) {
    return new ManualBankTransferProvider();
  }

  if (method === PaymentMethod.CRYPTO_USDT) {
    return cryptoEnabled ? new ManualDomesticProvider("crypto-usdt-manual-review") : new DisabledCryptoProvider();
  }

  if (method === PaymentMethod.WECHAT_PAY) {
    return new ManualDomesticProvider("manual-wechat-pay");
  }

  if (method === PaymentMethod.ALIPAY) {
    return new ManualDomesticProvider("manual-alipay");
  }

  return new ManualDomesticProvider("manual-payment");
}

export async function createCheckoutOrder(
  input: unknown,
  options: {
    client?: PaymentClient;
    cryptoEnabled?: boolean;
  } = {}
) {
  const parsed = checkoutInputSchema.parse(input);

  if (applicationPlans.has(parsed.planCode)) {
    throw new PaymentError("B2 and B3 require a team application before checkout.", {
      code: "APPLICATION_REQUIRED",
      applicationHref: "/apply/team"
    });
  }

  if (!selfServePlans.has(parsed.planCode)) {
    throw new PaymentError(`${parsed.planCode} is not available for checkout.`, {
      code: "PLAN_NOT_CHECKOUTABLE"
    });
  }

  if (parsed.ownerType === OwnerType.TEAM && parsed.planCode !== PlanCode.B1) {
    throw new PaymentError("Only B1 is self-serve for team checkout.", {
      code: "TEAM_PLAN_NOT_SELF_SERVE"
    });
  }

  const cryptoEnabled = options.cryptoEnabled ?? process.env.ENABLE_CRYPTO_PAYMENTS === "true";
  const provider = resolveProvider(parsed.method, cryptoEnabled);
  const payment = await provider.createPayment(parsed);
  const client = getPaymentClient(options.client);

  return client.paymentOrder.create({
    data: {
      userId: parsed.userId ?? (parsed.ownerType === OwnerType.USER ? parsed.ownerId : null),
      teamId: parsed.teamId ?? (parsed.ownerType === OwnerType.TEAM ? parsed.ownerId : null),
      ownerType: parsed.ownerType,
      ownerId: parsed.ownerId,
      ownerLabel: parsed.ownerLabel ?? null,
      planCode: parsed.planCode,
      method: parsed.method,
      status: payment.status,
      amountCents: resolveAmountCents(parsed.planCode),
      currency: "RMB",
      paymentProvider: payment.provider,
      providerOrderId: payment.providerOrderId ?? null,
      metadata: payment.metadata ?? null
    }
  });
}

export async function listPaymentOrders(
  input: {
    ownerType: OwnerType;
    ownerId: string;
    client?: PaymentClient;
    take?: number;
  }
) {
  const client = getPaymentClient(input.client);

  return client.paymentOrder.findMany({
    where: {
      ownerType: input.ownerType,
      ownerId: input.ownerId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: input.take ?? 20
  });
}
