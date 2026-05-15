import { cookies } from "next/headers";
import { OwnerType, PlanCode, SubscriptionStatus, type Prisma, type User } from "@prisma/client";
import { db } from "./db";
import { grantSignupCredits, type QuotaClient } from "./quota";

export const SESSION_COOKIE_NAME = "academic_hub_session";

type RegisteredUser = Pick<User, "id" | "email" | "name">;

type UserUpsertArgs = {
  where: {
    email: string;
  };
  update: {
    name?: string | null;
  };
  create: {
    email: string;
    name?: string | null;
  };
};

type UserFindUniqueArgs = {
  where: {
    id: string;
  };
};

type SubscriptionResult = {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  planCode: PlanCode;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
};

type SubscriptionUpsertArgs = {
  where: {
    ownerType_ownerId?: {
      ownerType: OwnerType;
      ownerId: string;
    };
  };
  update: Record<string, never>;
  create: {
    ownerType: OwnerType;
    ownerId: string;
    planCode: PlanCode;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd?: Date | null;
  };
};

type SubscriptionFindUniqueArgs = {
  where: {
    ownerType_ownerId?: {
      ownerType: OwnerType;
      ownerId: string;
    };
  };
};

export type AuthClient = {
  user: {
    upsert(args: UserUpsertArgs): Promise<RegisteredUser>;
    findUnique(args: UserFindUniqueArgs): Promise<RegisteredUser | null>;
  };
  subscription: {
    upsert(args: SubscriptionUpsertArgs): Promise<SubscriptionResult>;
    findUnique(args: SubscriptionFindUniqueArgs): Promise<SubscriptionResult | null>;
  };
};

type RegisterUserInput = {
  email: string;
  name?: string | null;
};

type RegisterUserOptions = {
  client?: AuthClient;
  quotaClient?: QuotaClient;
  now?: () => Date;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const prismaAuthClient: AuthClient = {
  user: {
    upsert: (args) => db.user.upsert(args),
    findUnique: (args) => db.user.findUnique(args)
  },
  subscription: {
    upsert: (args) => db.subscription.upsert(args as Prisma.SubscriptionUpsertArgs),
    findUnique: (args) => db.subscription.findUnique(args as Prisma.SubscriptionFindUniqueArgs)
  }
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(name: string | null | undefined) {
  const normalized = name?.trim();
  return normalized ? normalized : null;
}

export function createDevSessionToken(userId: string) {
  return `dev:${userId}`;
}

export function readUserIdFromSessionToken(token: string | undefined) {
  if (!token?.startsWith("dev:")) {
    return null;
  }

  const userId = token.slice("dev:".length).trim();
  return userId || null;
}

export async function registerUser(input: RegisterUserInput, options: RegisterUserOptions = {}) {
  const email = normalizeEmail(input.email);

  if (!email || !email.includes("@")) {
    throw new AuthError("A valid email address is required.");
  }

  const name = normalizeName(input.name);
  const client = options.client ?? prismaAuthClient;
  const quotaClient = options.quotaClient;
  const currentDate = options.now?.() ?? new Date();

  const user = await client.user.upsert({
    where: {
      email
    },
    update: name
      ? {
          name
        }
      : {},
    create: {
      email,
      name
    }
  });

  const subscription = await client.subscription.upsert({
    where: {
      ownerType_ownerId: {
        ownerType: OwnerType.USER,
        ownerId: user.id
      }
    },
    update: {},
    create: {
      ownerType: OwnerType.USER,
      ownerId: user.id,
      planCode: PlanCode.A0,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: currentDate,
      currentPeriodEnd: null
    }
  });

  await grantSignupCredits(user.id, {
    client: quotaClient
  });

  return {
    user,
    subscription,
    sessionToken: createDevSessionToken(user.id)
  };
}

export async function getCurrentUser(options: { client?: AuthClient; sessionToken?: string } = {}) {
  const client = options.client ?? prismaAuthClient;
  const sessionToken = options.sessionToken ?? (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const userId = readUserIdFromSessionToken(sessionToken);

  if (!userId) {
    return null;
  }

  return client.user.findUnique({
    where: {
      id: userId
    }
  });
}

export async function getCurrentSubscription(
  ownerId: string,
  options: {
    client?: AuthClient;
  } = {}
) {
  const client = options.client ?? prismaAuthClient;

  return client.subscription.findUnique({
    where: {
      ownerType_ownerId: {
        ownerType: OwnerType.USER,
        ownerId
      }
    }
  });
}
