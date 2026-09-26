export default function DataTable({
  columns,
  rows,
  emptyMessage = 'No records found in this view.',
}: {
  columns: string[];
  rows: (string | number | React.ReactNode)[][];
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0F172A] shadow-sm">
      <table className="data-table w-full min-w-[680px] text-sm">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {rows.length ? (
            rows.map((row, index) => (
              <tr
                key={index}
                className="transition hover:bg-slate-800/40 text-slate-200"
              >
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="py-14 text-center text-xs text-slate-500 font-medium"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
