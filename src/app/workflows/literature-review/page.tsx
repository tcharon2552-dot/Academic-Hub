import Link from "next/link";
import { WorkflowForm } from "@/components/workflow-form";

export default function LiteratureReviewPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link href="/dashboard" className="text-base font-semibold text-moss">
            Academic Hub
          </Link>
          <Link href="/pricing" className="rounded-md px-3 py-2 text-sm font-medium text-moss hover:bg-white">
            Pricing
          </Link>
        </header>

        <section className="py-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-moss">Literature review</p>
          <h1 className="mt-3 text-3xl font-semibold">Compare papers and synthesize themes</h1>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            Paste two or more paper blocks. Put the title on the first line and the abstract below it.
          </p>
        </section>

        <WorkflowForm
          endpoint="/api/workflows/literature-review"
          submitLabel="Create synthesis"
          fields={[
            {
              name: "question",
              label: "Research question",
              placeholder: "How do these papers approach retrieval augmented generation for scientific research?",
              rows: 3,
              required: true
            },
            {
              name: "papers",
              label: "Paper blocks",
              placeholder: "Paper title\nAbstract text...\n\nSecond paper title\nAbstract text...",
              rows: 14,
              required: true
            }
          ]}
          mode="literature-review"
        />
      </section>
    </main>
  );
}
