import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends { _id?: string; id?: string }>({
  data,
  columns,
  loading,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-[#F2DFFF] rounded"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[#F2DFFF] rounded"></div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-[#1E2934BA] opacity-60">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#F2DFFF]">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-6 py-3 text-left text-sm font-semibold text-[#1E2934BA] ${
                  column.className || ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F2DFFF]">
          {data.map((row, rowIndex) => (
            <tr
              key={row._id || row.id || rowIndex}
              className="hover:bg-[#F2DFFF] hover:bg-opacity-50 transition-colors"
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-6 py-4 text-sm text-[#1E2934BA] ${
                    column.className || ''
                  }`}
                >
                  {typeof column.accessor === 'function'
                    ? column.accessor(row)
                    : String(row[column.accessor] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
