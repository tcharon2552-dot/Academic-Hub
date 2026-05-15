export type PlanCode = "A0" | "A1" | "A2" | "A3" | "B1" | "B2" | "B3";
export type PlanAudience = "individual" | "team";
export type PlanAccessMode = "free" | "self-serve" | "application";
export type PlanCurrency = "RMB";
export type PlanBillingPeriod = "free" | "month" | "annual-contract";

export type PlanPricing = Readonly<{
  currency: PlanCurrency;
  monthlyPriceMin: number;
  monthlyPriceMax: number | null;
  billingPeriod: PlanBillingPeriod;
}>;

export type PlanQuotaDefaults = Readonly<{
  researchTaskCredits: number;
  paperReadingCredits: number;
  longDocumentCredits: number;
  advancedModelCredits: number;
}>;

export type PlanCatalogItem = Readonly<{
  code: PlanCode;
  name: string;
  audience: PlanAudience;
  accessMode: PlanAccessMode;
  priceLabel: string;
  pricing: PlanPricing;
  signupCredits: number;
  monthlyCredits: number;
  quotaDefaults: PlanQuotaDefaults;
  seatLabel: string;
  summary: string;
  features: readonly string[];
  ctaLabel: string;
  ctaHref: string;
  isUnlimited: false;
}>;

const definePlan = (plan: PlanCatalogItem): PlanCatalogItem =>
  Object.freeze({
    ...plan,
    pricing: Object.freeze({ ...plan.pricing }),
    quotaDefaults: Object.freeze({ ...plan.quotaDefaults }),
    features: Object.freeze([...plan.features])
  });

const plans = [
  {
    code: "A0",
    name: "Free Credits",
    audience: "individual",
    accessMode: "free",
    priceLabel: "Free",
    pricing: {
      currency: "RMB",
      monthlyPriceMin: 0,
      monthlyPriceMax: 0,
      billingPeriod: "free"
    },
    signupCredits: 30,
    monthlyCredits: 0,
    quotaDefaults: {
      researchTaskCredits: 30,
      paperReadingCredits: 5,
      longDocumentCredits: 0,
      advancedModelCredits: 2
    },
    seatLabel: "1 researcher",
    summary: "Registration credits for paper reading, summary, Q&A, and writing polish trials.",
    features: [
      "Limited paper reading credits",
      "Single PDF summary",
      "Basic academic Q&A",
      "Basic writing polish"
    ],
    ctaLabel: "Start with credits",
    ctaHref: "/dashboard",
    isUnlimited: false
  },
  {
    code: "A1",
    name: "Student Basic",
    audience: "individual",
    accessMode: "self-serve",
    priceLabel: "RMB 19-39 / month",
    pricing: {
      currency: "RMB",
      monthlyPriceMin: 19,
      monthlyPriceMax: 39,
      billingPeriod: "month"
    },
    signupCredits: 0,
    monthlyCredits: 300,
    quotaDefaults: {
      researchTaskCredits: 300,
      paperReadingCredits: 30,
      longDocumentCredits: 3,
      advancedModelCredits: 10
    },
    seatLabel: "1 researcher",
    summary: "Low-friction student plan for single-paper reading and basic academic writing help.",
    features: [
      "Single-paper reading",
      "Basic PDF summaries",
      "Paper outline extraction",
      "Citation format help"
    ],
    ctaLabel: "Choose A1",
    ctaHref: "/dashboard",
    isUnlimited: false
  },
  {
    code: "A2",
    name: "Research Pro",
    audience: "individual",
    accessMode: "self-serve",
    priceLabel: "RMB 69-129 / month",
    pricing: {
      currency: "RMB",
      monthlyPriceMin: 69,
      monthlyPriceMax: 129,
      billingPeriod: "month"
    },
    signupCredits: 0,
    monthlyCredits: 1200,
    quotaDefaults: {
      researchTaskCredits: 1200,
      paperReadingCredits: 120,
      longDocumentCredits: 20,
      advancedModelCredits: 60
    },
    seatLabel: "1 researcher",
    summary: "Primary individual plan for literature review, long PDFs, and research writing workflows.",
    features: [
      "Batch paper comparison",
      "Literature review drafts",
      "Long PDF reading",
      "Review response drafting"
    ],
    ctaLabel: "Choose A2",
    ctaHref: "/dashboard",
    isUnlimited: false
  },
  {
    code: "A3",
    name: "Pro Plus",
    audience: "individual",
    accessMode: "self-serve",
    priceLabel: "RMB 199-299 / month",
    pricing: {
      currency: "RMB",
      monthlyPriceMin: 199,
      monthlyPriceMax: 299,
      billingPeriod: "month"
    },
    signupCredits: 0,
    monthlyCredits: 3000,
    quotaDefaults: {
      researchTaskCredits: 3000,
      paperReadingCredits: 300,
      longDocumentCredits: 60,
      advancedModelCredits: 180
    },
    seatLabel: "1 researcher",
    summary: "Higher quota and priority queue for heavy individual research workloads.",
    features: [
      "More advanced model credits",
      "More long document credits",
      "Priority queue",
      "Submission sprint workflows"
    ],
    ctaLabel: "Choose A3",
    ctaHref: "/dashboard",
    isUnlimited: false
  },
  {
    code: "B1",
    name: "Lab Starter",
    audience: "team",
    accessMode: "self-serve",
    priceLabel: "RMB 299-599 / month",
    pricing: {
      currency: "RMB",
      monthlyPriceMin: 299,
      monthlyPriceMax: 599,
      billingPeriod: "month"
    },
    signupCredits: 0,
    monthlyCredits: 6000,
    quotaDefaults: {
      researchTaskCredits: 6000,
      paperReadingCredits: 600,
      longDocumentCredits: 120,
      advancedModelCredits: 300
    },
    seatLabel: "3-5 members",
    summary: "Entry team plan with a shared quota pool and basic lab workspace controls.",
    features: [
      "Shared quota pool",
      "Shared literature library",
      "Basic team workspace",
      "Usage dashboard"
    ],
    ctaLabel: "Choose B1",
    ctaHref: "/dashboard",
    isUnlimited: false
  },
  {
    code: "B2",
    name: "Lab Team",
    audience: "team",
    accessMode: "application",
    priceLabel: "RMB 1,299-2,999 / month",
    pricing: {
      currency: "RMB",
      monthlyPriceMin: 1299,
      monthlyPriceMax: 2999,
      billingPeriod: "month"
    },
    signupCredits: 0,
    monthlyCredits: 24000,
    quotaDefaults: {
      researchTaskCredits: 24000,
      paperReadingCredits: 2400,
      longDocumentCredits: 500,
      advancedModelCredits: 1200
    },
    seatLabel: "10-20 members",
    summary: "Standard lab plan with review, proposal, analytics, and shared prompt workflows.",
    features: [
      "Multiple project spaces",
      "Shared prompt templates",
      "Grant proposal workflow",
      "Team usage analytics"
    ],
    ctaLabel: "Apply for B2",
    ctaHref: "/apply/team",
    isUnlimited: false
  },
  {
    code: "B3",
    name: "Lab Pro / Institute",
    audience: "team",
    accessMode: "application",
    priceLabel: "RMB 5,000+ / month or annual contract",
    pricing: {
      currency: "RMB",
      monthlyPriceMin: 5000,
      monthlyPriceMax: null,
      billingPeriod: "annual-contract"
    },
    signupCredits: 0,
    monthlyCredits: 75000,
    quotaDefaults: {
      researchTaskCredits: 75000,
      paperReadingCredits: 7500,
      longDocumentCredits: 1500,
      advancedModelCredits: 4000
    },
    seatLabel: "Institute scope",
    summary: "High-value lab or institute plan for governance, routing policy, and contract support.",
    features: [
      "SSO option",
      "Audit logs",
      "Private knowledge base",
      "Contract and invoice support"
    ],
    ctaLabel: "Apply for B3",
    ctaHref: "/apply/team",
    isUnlimited: false
  }
] satisfies readonly PlanCatalogItem[];

export const PLAN_CATALOG = Object.freeze(plans.map(definePlan));

export function getPlanByCode(code: PlanCode): PlanCatalogItem {
  const plan = PLAN_CATALOG.find((item) => item.code === code);

  if (!plan) {
    throw new Error(`Unknown plan code: ${code}`);
  }

  return plan;
}

export function getPublicPlans(): readonly PlanCatalogItem[] {
  return PLAN_CATALOG;
}
