import Link from "next/link";
import { TeamApplicationForm } from "@/components/team-application-form";

export default function TeamApplicationPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link href="/" className="text-base font-semibold text-moss">
            Academic Hub
          </Link>
          <nav className="flex gap-3" aria-label="Primary navigation">
            <Link href="/pricing" className="rounded-md px-3 py-2 text-sm font-medium text-moss hover:bg-white">
              Pricing
            </Link>
            <Link href="/team" className="rounded-md px-3 py-2 text-sm font-medium text-moss hover:bg-white">
              Team
            </Link>
          </nav>
        </header>

        <section className="grid gap-8 py-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-moss">B2 / B3 application</p>
            <h1 className="mt-3 text-3xl font-semibold">Apply for lab access</h1>
            <p className="mt-4 text-sm leading-6 text-ink/70">
              B2 and B3 plans are reviewed before activation so quotas, payment method, invoice, and contract needs can
              be matched to the lab.
            </p>
          </div>
          <div className="rounded-md border border-line bg-white p-5">
            <TeamApplicationForm />
          </div>
        </section>
      </section>
    </main>
  );
}
