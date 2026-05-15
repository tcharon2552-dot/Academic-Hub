import Link from "next/link";
import { WorkflowForm } from "@/components/workflow-form";

export default function PaperReaderPage() {
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
          <p className="text-sm font-semibold uppercase tracking-wide text-moss">Paper reader</p>
          <h1 className="mt-3 text-3xl font-semibold">Structured paper notes</h1>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            Paste a paper excerpt or full text to generate claims, methods, evidence, limitations, and follow-up notes.
          </p>
        </section>

        <WorkflowForm
          endpoint="/api/workflows/paper-reader"
          submitLabel="Read paper"
          fields={[
            {
              name: "title",
              label: "Paper title",
              placeholder: "Attention Is All You Need",
              type: "input",
              required: true
            },
            {
              name: "text",
              label: "Paper text",
              placeholder: "Paste abstract, introduction, or full paper text.",
              rows: 12,
              required: true
            }
          ]}
        />
      </section>
    </main>
  );
}
