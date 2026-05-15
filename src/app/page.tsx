import Link from "next/link";

const workflows = [
  "Read papers with structured summaries and traceable notes.",
  "Polish academic writing without changing the research claim.",
  "Draft literature reviews from a managed reading list."
];

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
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
            <Link
              href="/dashboard"
              className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-white transition hover:bg-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
            >
              Dashboard
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <section aria-labelledby="home-heading" className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-moss">
              Research AI workspace
            </p>
            <h1 id="home-heading" className="text-4xl font-semibold leading-tight sm:text-5xl">
              Academic Hub
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/75">
              A focused web workspace for researchers and labs to use AI through
              paper reading, literature review, academic writing, and research
              analysis workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="rounded-md bg-moss px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
              >
                View plans
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
              >
                Open dashboard
              </Link>
            </div>
          </section>

          <section aria-labelledby="workflow-heading" className="border-l border-line pl-6">
            <h2 id="workflow-heading" className="text-xl font-semibold">
              MVP workflow focus
            </h2>
            <ul className="mt-5 space-y-4">
              {workflows.map((workflow) => (
                <li key={workflow} className="border-b border-line pb-4 text-sm leading-6 text-ink/75">
                  {workflow}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
