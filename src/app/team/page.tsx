import Link from "next/link";

const teamPlanNotes = [
  "B1 is self-serve for small labs that need shared quota and basic team usage visibility.",
  "B2 adds reviewed onboarding for larger labs, invoice needs, and shared research workflows.",
  "B3 is reserved for institutes or high-governance deployments with contract support."
];

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-8">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link href="/" className="text-base font-semibold text-moss">
            Academic Hub
          </Link>
          <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-moss hover:bg-white">
            Dashboard
          </Link>
        </header>

        <section className="grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-moss">Lab workspace</p>
            <h1 className="mt-3 text-3xl font-semibold">Shared research AI for teams</h1>
            <p className="mt-4 text-sm leading-6 text-ink/70">
              Team plans combine shared quota, lab-level billing, and operational review before high-volume activation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-moss"
              >
                View B1
              </Link>
              <Link
                href="/apply/team"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-moss"
              >
                Apply for B2/B3
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-line bg-white p-5">
            <h2 className="text-base font-semibold">Team plan path</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-ink/70">
              {teamPlanNotes.map((note) => (
                <li key={note} className="border-b border-line pb-3 last:border-b-0">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}
