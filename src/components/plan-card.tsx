import Link from "next/link";
import type { PlanCatalogItem } from "@/lib/plans";

type PlanCardProps = {
  plan: PlanCatalogItem;
};

function getPlanCtaHref(plan: PlanCatalogItem) {
  if (plan.accessMode === "self-serve") {
    return `/billing?plan=${plan.code}`;
  }

  return plan.ctaHref;
}

export function PlanCard({ plan }: PlanCardProps) {
  const accessLabel =
    plan.accessMode === "application"
      ? "Application required"
      : plan.accessMode === "free"
        ? "Free signup credits"
        : "Self-serve";

  return (
    <article className="flex h-full flex-col rounded-md border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">{plan.code}</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{plan.name}</h2>
        </div>
        <span className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink/70">
          {accessLabel}
        </span>
      </div>

      <p className="mt-4 text-2xl font-semibold text-ink">{plan.priceLabel}</p>
      <p className="mt-3 text-sm leading-6 text-ink/70">{plan.summary}</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-line py-4 text-sm">
        <div>
          <dt className="text-ink/55">Seats</dt>
          <dd className="mt-1 font-medium text-ink">{plan.seatLabel}</dd>
        </div>
        <div>
          <dt className="text-ink/55">Monthly credits</dt>
          <dd className="mt-1 font-medium text-ink">
            {plan.monthlyCredits > 0 ? plan.monthlyCredits.toLocaleString("en-US") : "Signup only"}
          </dd>
        </div>
      </dl>

      {plan.signupCredits > 0 ? (
        <p className="mt-4 rounded-md bg-paper px-3 py-2 text-sm font-medium text-ink">
          Includes {plan.signupCredits.toLocaleString("en-US")} registration credits.
        </p>
      ) : null}

      <ul className="mt-5 space-y-2 text-sm leading-6 text-ink/75">
        {plan.features.map((feature) => (
          <li key={feature} className="border-b border-line pb-2 last:border-b-0 last:pb-0">
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={getPlanCtaHref(plan)}
        className="mt-auto inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
      >
        {plan.ctaLabel}
      </Link>
    </article>
  );
}
