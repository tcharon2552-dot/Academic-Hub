import { describe, expect, it } from "vitest";
import { getPlanByCode, PLAN_CATALOG } from "../../src/lib/plans";
import type { PlanCode } from "../../src/lib/plans";

describe("PLAN_CATALOG", () => {
  it("contains every public MVP tier", () => {
    expect(PLAN_CATALOG.map((plan) => plan.code)).toEqual([
      "A0",
      "A1",
      "A2",
      "A3",
      "B1",
      "B2",
      "B3"
    ]);
  });

  it("grants signup credits on A0", () => {
    const plan = getPlanByCode("A0");

    expect(plan.signupCredits).toBeGreaterThan(0);
    expect(plan.priceLabel).toBe("Free");
  });

  it("marks A1, A2, A3, and B1 as self-serve", () => {
    const selfServePlans: PlanCode[] = ["A1", "A2", "A3", "B1"];

    expect(selfServePlans.map((code) => getPlanByCode(code).accessMode)).toEqual([
      "self-serve",
      "self-serve",
      "self-serve",
      "self-serve"
    ]);
  });

  it("requires applications for B2 and B3", () => {
    const applicationPlans: PlanCode[] = ["B2", "B3"];

    expect(applicationPlans.map((code) => getPlanByCode(code).accessMode)).toEqual([
      "application",
      "application"
    ]);
  });

  it("does not mark any tier as unlimited", () => {
    expect(PLAN_CATALOG.every((plan) => plan.isUnlimited === false)).toBe(true);
  });
});
