"use client";

import { PaymentMethod, type PlanCode } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CheckoutPanelProps = {
  planCode: PlanCode;
  priceLabel: string;
};

type CheckoutResponse = {
  order?: {
    id: string;
    status: string;
    planCode: PlanCode | null;
    method: string;
    amountCents: number;
  };
  error?: string;
};

export function CheckoutPanel({ planCode, priceLabel }: CheckoutPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="rounded-md border border-line bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-moss">Selected plan</p>
      <h2 className="mt-2 text-2xl font-semibold">Complete {planCode} checkout</h2>
      <p className="mt-3 text-sm leading-6 text-ink/70">{priceLabel}</p>
      <p className="mt-3 text-sm leading-6 text-ink/70">
        This creates a self-serve payment order. Provider confirmation and subscription activation are handled by the
        payment operations layer.
      </p>
      <button
        type="button"
        disabled={isSubmitting}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-ink/60"
        onClick={async () => {
          setMessage(null);
          setError(null);
          setIsSubmitting(true);

          const response = await fetch("/api/billing/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              planCode,
              method: PaymentMethod.ALIPAY
            })
          });
          const body = (await response.json().catch(() => null)) as CheckoutResponse | null;
          setIsSubmitting(false);

          if (!response.ok) {
            setError(body?.error ?? "Checkout failed.");
            return;
          }

          setMessage("Payment order created.");
          router.refresh();
        }}
      >
        {isSubmitting ? "Creating order" : "Create Alipay order"}
      </button>
      {message ? <p className="mt-4 rounded-md bg-paper px-3 py-2 text-sm font-medium text-ink">{message}</p> : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
    </section>
  );
}
