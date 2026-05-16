"use client";

import { useEffect, useState } from "react";

export function RegisterForm() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <form
      className="mt-6 grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: formData.get("email"),
            name: formData.get("name")
          })
        });

        setIsSubmitting(false);

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? "Access failed.");
          return;
        }

        window.location.assign("/dashboard");
      }}
    >
      <label className="grid gap-2 text-sm font-medium text-ink">
        Email
        <input
          name="email"
          type="email"
          required
          className="min-h-11 rounded-md border border-line bg-paper px-3 py-2 text-base outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          placeholder="researcher@example.com"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-ink">
        Name
        <input
          name="name"
          className="min-h-11 rounded-md border border-line bg-paper px-3 py-2 text-base outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
          placeholder="Your name"
        />
      </label>
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={!isReady || isSubmitting}
        className="min-h-11 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-ink/60"
      >
        {isSubmitting ? "Continuing" : "Continue"}
      </button>
    </form>
  );
}
