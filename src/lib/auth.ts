import { cookies } from "next/headers";
import { OwnerType, PlanCode, SubscriptionStatus, UserRole, type Prisma, type User } from "@prisma/client";
import { db } from "./db";
import { isE2eMode } from "./e2e-mode";
import { grantSignupCredits, type QuotaClient } from "./quota";

export const SESSION_COOKIE_NAME = "academic_hub_session";

type RegisteredUser = Pick<User, "id" | "email" | "name" | "role">;

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

type E2eUserInput = {
  email: string;
  name?: string | null;
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

function createE2eUserId(email: string) {
  return `e2e:${normalizeEmail(email)}`;
}

export function createE2eAuthClient(input: E2eUserInput): AuthClient {
  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name);
  const userId = createE2eUserId(email);
  const e2eUser: RegisteredUser = {
    id: userId,
    email,
    name,
    role: UserRole.USER
  };
  const e2eSubscription: SubscriptionResult = {
    id: `subscription:${userId}`,
    ownerType: OwnerType.USER,
    ownerId: userId,
    planCode: PlanCode.A0,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
    currentPeriodEnd: null
  };

  return {
    user: {
      upsert: async () => e2eUser,
      findUnique: async ({ where }) => (where.id === userId ? e2eUser : null)
    },
    subscription: {
      upsert: async () => e2eSubscription,
      findUnique: async ({ where }) => {
        const owner = where.ownerType_ownerId;
        return owner?.ownerType === OwnerType.USER && owner.ownerId === userId ? e2eSubscription : null;
      }
    }
  };
}

export async function registerUser(input: RegisterUserInput, options: RegisterUserOptions = {}) {
  const email = normalizeEmail(input.email);

  if (!email || !email.includes("@")) {
    throw new AuthError("A valid email address is required.");
  }

  const name = normalizeName(input.name);
  const e2eClient = isE2eMode() ? createE2eAuthClient({ email, name }) : null;
  const client = options.client ?? prismaAuthClient;
  const authClient = e2eClient ?? client;
  const quotaClient = options.quotaClient;
  const currentDate = options.now?.() ?? new Date();

  const user = await authClient.user.upsert({
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

  const subscription = await authClient.subscription.upsert({
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

  if (!e2eClient) {
    await grantSignupCredits(user.id, {
      client: quotaClient
    });
  }

  return {
    user,
    subscription,
    sessionToken: createDevSessionToken(user.id)
  };
}

export async function getCurrentUser(options: { client?: AuthClient; sessionToken?: string } = {}) {
  const sessionToken = options.sessionToken ?? (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const userId = readUserIdFromSessionToken(sessionToken);

  if (!userId) {
    return null;
  }

  if (isE2eMode() && userId.startsWith("e2e:")) {
    const email = userId.slice("e2e:".length);
    return createE2eAuthClient({ email }).user.findUnique({
      where: {
        id: userId
      }
    });
  }

  const client = options.client ?? prismaAuthClient;

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
  if (isE2eMode() && ownerId.startsWith("e2e:")) {
    const email = ownerId.slice("e2e:".length);
    return createE2eAuthClient({ email }).subscription.findUnique({
      where: {
        ownerType_ownerId: {
          ownerType: OwnerType.USER,
          ownerId
        }
      }
    });
  }

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

export async function requireAdminUser(options: { client?: AuthClient; sessionToken?: string } = {}) {
  const user = await getCurrentUser(options);

  if (!user || user.role !== UserRole.ADMIN) {
    throw new AuthError("Admin access required.");
  }

  return user;
}
