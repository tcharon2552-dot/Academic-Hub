# Payment Compliance Notes

Academic Hub is primarily China-facing. Payment design should optimize for domestic conversion while keeping sensitive payment methods isolated.

## Operating Position

- Domestic payment is P0.
- WeChat Pay, Alipay, and bank transfer should be the launch path.
- Crypto payment is disabled by default.
- Crypto payment requires legal review and separate operational controls before any user-facing release.

## Domestic Payment Scope

Launch with domestic methods first:

- WeChat Pay or Alipay for A1/A2/A3 and B1 self-serve checkout.
- Bank transfer for B1 when needed and for B2/B3 contract sales.
- Manual finance review before activating team plans paid by bank transfer.
- Invoice support for B plans, especially B2/B3.

Implementation expectation:

- Payment orders must record owner, plan, method, amount, currency, provider, provider order ID, status, and reconciliation metadata.
- Provider callbacks or manual finance actions must update payment status before quota or subscription changes are granted.
- Refunds and compensation quota must be traceable through payment orders and quota ledger adjustments.

## Crypto Payment Boundary

Crypto is not part of the China-facing MVP launch.

Rules:

- Do not make crypto payment the default payment method.
- Do not publicly market crypto payment to mainland China users.
- Do not expose OKX Pay, USDT, or similar crypto payment methods until legal review approves the user segment, operating entity, accounting treatment, and support process.
- Keep crypto payment records separate enough for accounting, audit, refund, and risk review.
- Require manual review for any crypto-enabled account.

The codebase reflects this boundary by keeping `ENABLE_CRYPTO_PAYMENTS` off by default. When disabled, `CRYPTO_USDT` checkout raises `CRYPTO_DISABLED` and does not create an order.

## Required Review Before Enabling Crypto

Before setting `ENABLE_CRYPTO_PAYMENTS=true`, complete:

- Legal review of target user geography and marketing copy.
- Accounting review for settlement currency, exchange-rate handling, invoice handling, and tax records.
- Risk review for chargebacks, refunds, sanctions screening, and account abuse.
- Support runbook for failed transfers, underpayment, overpayment, and refund requests.
- Separate reporting for crypto orders and manually approved users.

## Recommended Launch Decision

For MVP launch, keep crypto off and ship with:

1. One domestic payment provider that can support WeChat Pay or Alipay.
2. Manual bank transfer review for lab and institute customers.
3. B2/B3 application approval before contract payment.
4. Add-on quota packages only after the base subscription flow is stable.

Crypto can be revisited after product-market fit signals are visible and the compliance model is explicit.
