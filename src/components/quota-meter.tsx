type QuotaMeterProps = {
  researchTaskCredits: number;
  advancedModelCredits: number;
  longDocumentCredits: number;
};

const quotaRows = [
  {
    key: "researchTaskCredits",
    label: "Research task credits"
  },
  {
    key: "advancedModelCredits",
    label: "Advanced model credits"
  },
  {
    key: "longDocumentCredits",
    label: "Long document credits"
  }
] as const;

export function QuotaMeter({
  researchTaskCredits,
  advancedModelCredits,
  longDocumentCredits
}: QuotaMeterProps) {
  const values = {
    researchTaskCredits,
    advancedModelCredits,
    longDocumentCredits
  };

  return (
    <section aria-labelledby="quota-meter-heading" className="rounded-md border border-line bg-white p-5">
      <h2 id="quota-meter-heading" className="text-base font-semibold text-ink">
        Available quota
      </h2>
      <dl className="mt-4 space-y-3">
        {quotaRows.map((row) => (
          <div key={row.key} className="flex items-center justify-between border-b border-line pb-3 last:border-b-0">
            <dt className="text-sm text-ink/65">{row.label}</dt>
            <dd className="text-sm font-semibold text-ink">{values[row.key].toLocaleString("en-US")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
