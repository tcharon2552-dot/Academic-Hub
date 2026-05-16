"use client";

import { PaymentMethod, type PlanCode } from "@prisma/client";
import { useEffect, useState } from "react";

type CheckoutPanelProps = {
  planCode: PlanCode;
  priceLabel: string;
  cryptoEnabled?: boolean;
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

const domesticPaymentOptions = [
  {
    method: PaymentMethod.ALIPAY,
    label: "Alipay",
    description: "Create a domestic Alipay order for manual provider confirmation."
  },
  {
    method: PaymentMethod.WECHAT_PAY,
    label: "WeChat Pay",
    description: "Create a domestic WeChat Pay order for manual provider confirmation."
  },
  {
    method: PaymentMethod.BANK_TRANSFER,
    label: "Bank transfer",
    description: "Create a bank transfer order that stays under finance review."
  }
] as const;

const cryptoPaymentOption = {
  method: PaymentMethod.CRYPTO_USDT,
  label: "USDT",
  description: "Create a USDT order for compliance and payment operations review."
} as const;

export function CheckoutPanel({ planCode, priceLabel, cryptoEnabled = false }: CheckoutPanelProps) {
  const [isReady, setIsReady] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.ALIPAY);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CheckoutResponse["order"] | null>(null);
  const paymentOptions = cryptoEnabled ? [...domesticPaymentOptions, cryptoPaymentOption] : domesticPaymentOptions;

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <section className="rounded-md border border-line bg-white p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-moss">Selected plan</p>
      <h2 className="mt-2 text-2xl font-semibold">Complete {planCode} checkout</h2>
      <p className="mt-3 text-sm leading-6 text-ink/70">{priceLabel}</p>
      <p className="mt-3 text-sm leading-6 text-ink/70">
        This creates a self-serve payment order. Provider confirmation and subscription activation are handled by the
        payment operations layer.
      </p>
      <fieldset className="mt-5 grid gap-3">
        <legend className="text-sm font-semibold text-ink">Payment method</legend>
        {paymentOptions.map((option) => (
          <label
            key={option.method}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-paper px-3 py-3 text-sm transition has-[:checked]:border-moss has-[:checked]:bg-white"
          >
            <input
              type="radio"
              name="paymentMethod"
              value={option.method}
              checked={selectedMethod === option.method}
              disabled={!isReady || isSubmitting}
              onChange={() => setSelectedMethod(option.method)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block font-semibold text-ink">{option.label}</span>
              <span className="mt-1 block leading-5 text-ink/65">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        disabled={!isReady || isSubmitting}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-ink/60"
        onClick={async () => {
          setMessage(null);
          setError(null);
          setCreatedOrder(null);
          setIsSubmitting(true);

          const response = await fetch("/api/billing/checkout", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              planCode,
              method: selectedMethod
            })
          });
          const body = (await response.json().catch(() => null)) as CheckoutResponse | null;
          setIsSubmitting(false);

          if (!response.ok) {
            setError(body?.error ?? "Checkout failed.");
            return;
          }

          if (body?.order) {
            setCreatedOrder(body.order);
            setMessage("Payment order created.");
          } else {
            setError("Checkout failed.");
          }
        }}
      >
        {isSubmitting ? "Creating order" : "Create payment order"}
      </button>
      {message ? <p className="mt-4 rounded-md bg-paper px-3 py-2 text-sm font-medium text-ink">{message}</p> : null}
      {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
      {createdOrder ? (
        <div className="mt-4 rounded-md border border-line bg-paper px-3 py-2">
          <p className="text-sm font-medium text-ink">
            {createdOrder.planCode} · {createdOrder.method} · RMB{" "}
            {(createdOrder.amountCents / 100).toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-xs font-semibold text-moss">{createdOrder.status}</p>
        </div>
      ) : null}
    </section>
  );
}
