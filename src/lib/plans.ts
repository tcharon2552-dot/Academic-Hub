export type PlanCode = "A0" | "A1" | "A2" | "A3" | "B1" | "B2" | "B3";
export type PlanAudience = "individual" | "team";
export type PlanAccessMode = "free" | "self-serve" | "application";

export type PlanCatalogItem = {
  code: PlanCode;
  name: string;
  audience: PlanAudience;
  accessMode: PlanAccessMode;
  priceLabel: string;
  signupCredits: number;
  monthlyCredits: number;
  seatLabel: string;
  summary: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  isUnlimited: false;
};

export const PLAN_CATALOG: PlanCatalogItem[] = [
  {
    code: "A0",
    name: "Free Credits",
    audience: "individual",
    accessMode: "free",
    priceLabel: "Free",
    signupCredits: 30,
    monthlyCredits: 0,
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
    signupCredits: 0,
    monthlyCredits: 300,
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
    signupCredits: 0,
    monthlyCredits: 1200,
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
    signupCredits: 0,
    monthlyCredits: 3000,
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
    signupCredits: 0,
    monthlyCredits: 6000,
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
    signupCredits: 0,
    monthlyCredits: 24000,
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
    signupCredits: 0,
    monthlyCredits: 75000,
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
];

export function getPlanByCode(code: PlanCode): PlanCatalogItem {
  const plan = PLAN_CATALOG.find((item) => item.code === code);

  if (!plan) {
    throw new Error(`Unknown plan code: ${code}`);
  }

  return plan;
}

export function getPublicPlans(): PlanCatalogItem[] {
  return PLAN_CATALOG;
}
