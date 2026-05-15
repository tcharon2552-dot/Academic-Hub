import Link from "next/link";
import { getCurrentSubscription, getCurrentUser } from "@/lib/auth";
import { getPlanByCode } from "@/lib/plans";
import { getQuotaBalance, QUOTA_TYPES } from "@/lib/quota";
import { QuotaMeter } from "@/components/quota-meter";
import { RegisterForm } from "@/components/register-form";

const workflowCards = [
  {
    title: "Paper reader",
    description: "Read a paper, extract claims, and keep structured notes.",
    href: "/workflows/paper-reader"
  },
  {
    title: "Writing polish",
    description: "Improve academic paragraphs while preserving the research claim.",
    href: "/workflows/writing-polish"
  },
  {
    title: "Literature review",
    description: "Turn a reading list into a comparison outline and synthesis draft.",
    href: "/workflows/literature-review"
  }
];

function RegistrationPanel() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-10">
        <Link href="/" className="mb-8 text-base font-semibold text-moss">
          Academic Hub
        </Link>
        <div className="rounded-md border border-line bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-moss">Developer registration</p>
          <h1 className="mt-3 text-3xl font-semibold">Start with A0 research credits</h1>
          <p className="mt-4 text-sm leading-6 text-ink/70">
            Create a development account to activate free signup quota and open the research workspace.
          </p>
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <RegistrationPanel />;
  }

  const subscription = await getCurrentSubscription(user.id);
  const plan = getPlanByCode(subscription?.planCode ?? "A0");
  const [researchTaskCredits, advancedModelCredits, longDocumentCredits] = await Promise.all([
    getQuotaBalance(user.id, QUOTA_TYPES.researchTask),
    getQuotaBalance(user.id, QUOTA_TYPES.advancedModel),
    getQuotaBalance(user.id, QUOTA_TYPES.longDocument)
  ]);
  const lowQuota = researchTaskCredits < 10 || advancedModelCredits < 2;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link href="/" className="text-base font-semibold tracking-normal">
            Academic Hub
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="rounded-md px-3 py-2 text-sm font-medium text-moss transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-moss"
            >
              Pricing
            </Link>
          </nav>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-moss">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold">Research workspace</h1>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              {user.email} · Current plan {plan.code} / {plan.name}
            </p>
          </div>
          <div className="rounded-md border border-line bg-white p-5">
            <p className="text-sm font-semibold text-ink">{plan.priceLabel}</p>
            <p className="mt-2 text-sm leading-6 text-ink/70">{plan.summary}</p>
            <Link
              href="/pricing"
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
            >
              Manage plan
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <QuotaMeter
              researchTaskCredits={researchTaskCredits}
              advancedModelCredits={advancedModelCredits}
              longDocumentCredits={longDocumentCredits}
            />
            {lowQuota ? (
              <div className="rounded-md border border-line bg-white p-5">
                <p className="text-sm font-semibold text-ink">Quota is running low</p>
                <p className="mt-2 text-sm leading-6 text-ink/70">
                  Upgrade to A1 or add credits before starting heavier literature review work.
                </p>
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-paper px-4 py-2 text-sm font-semibold text-ink transition hover:border-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
                >
                  View upgrades
                </Link>
              </div>
            ) : null}
          </div>

          <section aria-labelledby="workflow-heading" className="grid gap-4 md:grid-cols-3">
            <h2 id="workflow-heading" className="sr-only">
              Workflows
            </h2>
            {workflowCards.map((workflow) => (
              <Link
                key={workflow.title}
                href={workflow.href}
                className="rounded-md border border-line bg-white p-5 transition hover:border-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
              >
                <h3 className="text-base font-semibold text-ink">{workflow.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink/70">{workflow.description}</p>
              </Link>
            ))}
          </section>
        </section>
      </section>
    </main>
  );
}
