import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import { AuthError, requireAdminUser, type AuthClient } from "../../src/lib/auth";

function createAuthClient(role: UserRole): AuthClient {
  return {
    user: {
      upsert: async ({ create }) => ({
        id: "user-1",
        email: create.email,
        name: create.name ?? null,
        role
      }),
      findUnique: async () => ({
        id: "user-1",
        email: "admin@example.com",
        name: "Admin",
        role
      })
    },
    subscription: {
      upsert: async ({ create }) => ({
        id: "subscription-1",
        ownerType: create.ownerType,
        ownerId: create.ownerId,
        planCode: create.planCode,
        status: create.status,
        currentPeriodStart: create.currentPeriodStart,
        currentPeriodEnd: create.currentPeriodEnd ?? null
      }),
      findUnique: async () => null
    }
  };
}

describe("admin auth guard", () => {
  it("allows admin users", async () => {
    await expect(
      requireAdminUser({
        client: createAuthClient(UserRole.ADMIN),
        sessionToken: "dev:user-1"
      })
    ).resolves.toMatchObject({
      id: "user-1",
      role: UserRole.ADMIN
    });
  });

  it("rejects non-admin users", async () => {
    await expect(
      requireAdminUser({
        client: createAuthClient(UserRole.USER),
        sessionToken: "dev:user-1"
      })
    ).rejects.toBeInstanceOf(AuthError);
  });
});
