"use client";

import { useState } from "react";

type ApplicationResponse = {
  application?: {
    id: string;
  };
  error?: string;
};

export function TeamApplicationForm() {
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setApplicationId(null);
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const response = await fetch("/api/applications/team", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            applicantName: formData.get("applicantName"),
            institution: formData.get("institution"),
            labName: formData.get("labName"),
            contactEmail: formData.get("contactEmail"),
            desiredPlanCode: formData.get("desiredPlanCode"),
            memberCount: Number(formData.get("memberCount")),
            useCase: formData.get("useCase"),
            invoiceRequired: formData.get("invoiceRequired") === "on",
            contractRequired: formData.get("contractRequired") === "on",
            paymentPreference: formData.get("paymentPreference")
          })
        });
        const body = (await response.json().catch(() => null)) as ApplicationResponse | null;
        setIsSubmitting(false);

        if (!response.ok) {
          setError(body?.error ?? "Application failed.");
          return;
        }

        setApplicationId(body?.application?.id ?? null);
        event.currentTarget.reset();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-ink">
          Applicant name
          <input name="applicantName" required className="min-h-11 rounded-md border border-line px-3 py-2" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Contact email
          <input name="contactEmail" type="email" required className="min-h-11 rounded-md border border-line px-3 py-2" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-ink">
          Institution
          <input name="institution" required className="min-h-11 rounded-md border border-line px-3 py-2" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Lab/team name
          <input name="labName" required className="min-h-11 rounded-md border border-line px-3 py-2" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-ink">
          Desired plan
          <select name="desiredPlanCode" required className="min-h-11 rounded-md border border-line px-3 py-2">
            <option value="B2">B2 Lab Team</option>
            <option value="B3">B3 Lab Pro / Institute</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          Expected members
          <input
            name="memberCount"
            type="number"
            min="2"
            required
            className="min-h-11 rounded-md border border-line px-3 py-2"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-ink">
        Main use case
        <textarea name="useCase" required rows={6} className="rounded-md border border-line px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-ink">
        Payment preference
        <select name="paymentPreference" required className="min-h-11 rounded-md border border-line px-3 py-2">
          <option value="BANK_TRANSFER">Bank transfer</option>
          <option value="WECHAT_PAY">WeChat Pay</option>
          <option value="ALIPAY">Alipay</option>
          <option value="MANUAL">Manual review</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-4 text-sm text-ink/75">
        <label className="inline-flex items-center gap-2">
          <input name="invoiceRequired" type="checkbox" className="h-4 w-4" />
          Invoice required
        </label>
        <label className="inline-flex items-center gap-2">
          <input name="contractRequired" type="checkbox" className="h-4 w-4" />
          Contract required
        </label>
      </div>
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {applicationId ? (
        <p className="rounded-md border border-line bg-white px-3 py-2 text-sm text-ink">
          Application submitted: {applicationId}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-11 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:bg-ink/60"
      >
        {isSubmitting ? "Submitting application" : "Submit application"}
      </button>
    </form>
  );
}
