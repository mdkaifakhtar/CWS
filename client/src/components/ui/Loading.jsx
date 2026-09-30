export const Skeleton = ({ className = '' }) => (
  <div className={`bg-white/5 rounded animate-pulse ${className}`} />
);

export const RowSkeleton = () => (
  <div className="flex items-center gap-4 px-4 py-3.5 border-b border-white/10 last:border-0">
    <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-6 w-20 rounded-full" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-ink-card border border-white/10 rounded-xl2 overflow-hidden">
    {Array.from({ length: rows }).map((_, i) => (
      <RowSkeleton key={i} />
    ))}
  </div>
);

// Minimal responsive table wrapper — columns: [{ key, label, render? }]
export const Table = ({ columns, rows, rowKey = '_id', onRowClick }) => (
  <div className="bg-ink-card border border-white/10 rounded-xl2 overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-white/10">
          {columns.map((col) => (
            <th key={col.key} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row[rowKey]}
            onClick={() => onRowClick?.(row)}
            className={`border-b border-white/5 last:border-0 text-slate-200 ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
          >
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3.5 whitespace-nowrap">
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
