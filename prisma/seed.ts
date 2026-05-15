import { PrismaClient, type PlanCode } from "@prisma/client";
import { PLAN_CATALOG } from "../src/lib/plans";

const prisma = new PrismaClient();

async function main() {
  for (const plan of PLAN_CATALOG) {
    await prisma.plan.upsert({
      where: {
        code: plan.code as PlanCode
      },
      update: {
        name: plan.name,
        audience: plan.audience,
        accessMode: plan.accessMode,
        priceLabel: plan.priceLabel,
        currency: plan.pricing.currency,
        monthlyPriceMin: plan.pricing.monthlyPriceMin,
        monthlyPriceMax: plan.pricing.monthlyPriceMax,
        billingPeriod: plan.pricing.billingPeriod,
        signupCredits: plan.signupCredits,
        monthlyCredits: plan.monthlyCredits,
        quotaDefaults: { ...plan.quotaDefaults },
        seatLabel: plan.seatLabel,
        summary: plan.summary,
        features: [...plan.features],
        isUnlimited: plan.isUnlimited
      },
      create: {
        code: plan.code as PlanCode,
        name: plan.name,
        audience: plan.audience,
        accessMode: plan.accessMode,
        priceLabel: plan.priceLabel,
        currency: plan.pricing.currency,
        monthlyPriceMin: plan.pricing.monthlyPriceMin,
        monthlyPriceMax: plan.pricing.monthlyPriceMax,
        billingPeriod: plan.pricing.billingPeriod,
        signupCredits: plan.signupCredits,
        monthlyCredits: plan.monthlyCredits,
        quotaDefaults: { ...plan.quotaDefaults },
        seatLabel: plan.seatLabel,
        summary: plan.summary,
        features: [...plan.features],
        isUnlimited: plan.isUnlimited
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
