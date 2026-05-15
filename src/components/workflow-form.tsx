"use client";

import { useState } from "react";

type WorkflowField = {
  name: string;
  label: string;
  placeholder: string;
  type?: "input" | "textarea";
  rows?: number;
  required?: boolean;
};

type WorkflowFormProps = {
  endpoint: string;
  submitLabel: string;
  fields: WorkflowField[];
  mode?: "default" | "literature-review";
};

type WorkflowResponse = {
  output?: string;
  error?: string;
};

function parseLiteratureReviewPapers(value: string) {
  return value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const [firstLine, ...rest] = block.split("\n");
      return {
        title: firstLine?.trim() || `Paper ${index + 1}`,
        abstract: rest.join("\n").trim() || block
      };
    });
}

function buildRequestBody(values: Record<string, string>, mode: WorkflowFormProps["mode"]) {
  if (mode === "literature-review") {
    return {
      question: values.question,
      papers: parseLiteratureReviewPapers(values.papers)
    };
  }

  return values;
}

export function WorkflowForm({ endpoint, submitLabel, fields, mode = "default" }: WorkflowFormProps) {
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setOutput(null);
        setError(null);
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const values = Object.fromEntries(fields.map((field) => [field.name, String(formData.get(field.name) ?? "")]));
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(buildRequestBody(values, mode))
        });
        const body = (await response.json().catch(() => null)) as WorkflowResponse | null;
        setIsSubmitting(false);

        if (!response.ok) {
          setError(body?.error ?? "Workflow failed.");
          return;
        }

        setOutput(body?.output ?? "");
      }}
    >
      {fields.map((field) => (
        <label key={field.name} className="grid gap-2 text-sm font-medium text-ink">
          {field.label}
          {field.type === "input" ? (
            <input
              name={field.name}
              required={field.required}
              className="min-h-11 rounded-md border border-line bg-white px-3 py-2 text-base outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
              placeholder={field.placeholder}
            />
          ) : (
            <textarea
              name={field.name}
              required={field.required}
              rows={field.rows ?? 8}
              className="rounded-md border border-line bg-white px-3 py-2 text-base outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
              placeholder={field.placeholder}
            />
          )}
        </label>
      ))}
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-11 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-ink/60"
      >
        {isSubmitting ? "Running workflow" : submitLabel}
      </button>
      {output ? (
        <section aria-label="Workflow output" className="rounded-md border border-line bg-white p-4">
          <pre className="whitespace-pre-wrap text-sm leading-6 text-ink/80">{output}</pre>
        </section>
      ) : null}
    </form>
  );
}
