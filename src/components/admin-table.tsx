import type { ReactNode } from "react";

type AdminTableProps<T> = {
  title: string;
  columns: string[];
  rows: T[];
  emptyLabel: string;
  renderRow: (row: T) => ReactNode;
};

export function AdminTable<T>({ title, columns, rows, emptyLabel, renderRow }: AdminTableProps<T>) {
  return (
    <section className="rounded-md border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-paper">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-ink/60" colSpan={columns.length}>
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
