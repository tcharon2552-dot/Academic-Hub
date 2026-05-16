import { OwnerType, PlanCode } from "@prisma/client";
import Link from "next/link";
import { CheckoutPanel } from "@/components/checkout-panel";
import { getCurrentSubscription, getCurrentUser } from "@/lib/auth";
import { getPlanByCode } from "@/lib/plans";
import { listPaymentOrders } from "@/lib/payments";

export const dynamic = "force-dynamic";

const addOns = [
  "Paper reading pack",
  "Long document pack",
  "Advanced model pack"
];

const selfServeCheckoutPlans = new Set<PlanCode>([PlanCode.A1, PlanCode.A2, PlanCode.A3, PlanCode.B1]);

function getSelectedPlan(plan?: string | string[]) {
  const code = Array.isArray(plan) ? plan[0] : plan;

  if (!code || !(code in PlanCode)) {
    return null;
  }

  const planCode = PlanCode[code as keyof typeof PlanCode];
  return selfServeCheckoutPlans.has(planCode) ? getPlanByCode(planCode) : null;
}

type BillingPageProps = {
  searchParams?: Promise<{
    plan?: string | string[];
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <section className="mx-auto w-full max-w-3xl px-6 py-12">
          <Link href="/" className="text-base font-semibold text-moss">
            Academic Hub
          </Link>
          <div className="mt-8 rounded-md border border-line bg-white p-6">
            <h1 className="text-2xl font-semibold">Billing requires registration</h1>
            <Link
              href="/dashboard"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              Go to dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const subscription = await getCurrentSubscription(user.id);
  const currentPlan = getPlanByCode(subscription?.planCode ?? "A0");
  const selectedPlan = getSelectedPlan((await searchParams)?.plan);
  const cryptoEnabled = process.env.ENABLE_CRYPTO_PAYMENTS === "true";
  const orders = await listPaymentOrders({
    ownerType: OwnerType.USER,
    ownerId: user.id
  });

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link href="/" className="text-base font-semibold text-moss">
            Academic Hub
          </Link>
          <Link href="/pricing" className="rounded-md px-3 py-2 text-sm font-medium text-moss hover:bg-white">
            Pricing
          </Link>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-moss">Billing</p>
            <h1 className="mt-3 text-3xl font-semibold">Subscription and payment orders</h1>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              Current plan {currentPlan.code} / {currentPlan.name}. Domestic methods are primary; crypto stays disabled
              until compliance review.
            </p>
          </div>
          <div className="rounded-md border border-line bg-white p-5">
            <p className="text-sm font-semibold">Bank transfer review</p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Team bank-transfer orders stay under review until finance confirms payment and invoice details.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-md border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Recent orders</h2>
            <div className="mt-4 space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-ink/60">No payment orders yet.</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="border-b border-line pb-3 last:border-b-0">
                    <p className="text-sm font-medium">
                      {order.planCode} · {order.method} · RMB {(order.amountCents / 100).toLocaleString("en-US")}
                    </p>
                    <p className="mt-1 text-xs text-ink/60">{order.status}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            {selectedPlan ? (
              <CheckoutPanel
                planCode={selectedPlan.code as PlanCode}
                priceLabel={selectedPlan.priceLabel}
                cryptoEnabled={cryptoEnabled}
              />
            ) : (
              <div className="rounded-md border border-line bg-white p-5">
                <h2 className="text-base font-semibold">Self-serve checkout</h2>
                <p className="mt-4 text-sm leading-6 text-ink/70">Use pricing to choose an A1/A2/A3/B1 plan.</p>
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
                >
                  Choose plan
                </Link>
              </div>
            )}
            <div className="rounded-md border border-line bg-white p-5">
              <h2 className="text-base font-semibold">Add-on packages</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink/70">
                {addOns.map((addOn) => (
                  <li key={addOn} className="border-b border-line pb-2 last:border-b-0">
                    {addOn}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
