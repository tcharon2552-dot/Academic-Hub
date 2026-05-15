import Link from "next/link";
import { PlanCard } from "@/components/plan-card";
import { getPublicPlans } from "@/lib/plans";

const addOns = [
  {
    name: "Paper reading pack",
    detail: "Extra credits for PDF reading, structured summaries, and paper Q&A."
  },
  {
    name: "Long document pack",
    detail: "Additional long-context credits for theses, grant drafts, and large reports."
  },
  {
    name: "Advanced model pack",
    detail: "Reserved credits for higher-cost model routes and priority research tasks."
  }
];

export default function PricingPage() {
  const plans = getPublicPlans();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link href="/" className="text-base font-semibold tracking-normal">
            Academic Hub
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-sm font-medium text-moss transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-moss"
            >
              Dashboard
            </Link>
          </nav>
        </header>

        <section aria-labelledby="pricing-heading" className="py-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-moss">Pricing</p>
          <h1 id="pricing-heading" className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            Quota-based research plans
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink/75">
            Public plans cover registration credits, individual subscriptions, and lab workspaces.
            Team tiers B2 and B3 require application review before activation.
          </p>
        </section>

        <section aria-label="Plan catalog" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.code} plan={plan} />
          ))}
        </section>

        <section aria-labelledby="addons-heading" className="mt-10 border-t border-line py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-moss">Add-ons</p>
              <h2 id="addons-heading" className="mt-2 text-2xl font-semibold">
                Credit packages for heavier months
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
            >
              Manage add-ons
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {addOns.map((addOn) => (
              <article key={addOn.name} className="rounded-md border border-line bg-white p-5">
                <h3 className="text-base font-semibold">{addOn.name}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/70">{addOn.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
