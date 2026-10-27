import React from 'react'

const COLUMN_ALIGN = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export default function Table({
  columns,
  data,
  rowKey = 'id',
  emptyMessage = 'No records found',
  className = '',
  ...props
}) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-base-800 border border-base-600 rounded-lg overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <p className="text-sm text-base-400">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-base-800 border border-base-600 rounded-lg overflow-hidden ${className}`}
      {...props}
    >
      <table className="w-full text-sm">
        <thead className="bg-base-700/50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3.5 text-[0.7rem] font-semibold text-base-400 uppercase tracking-wider ${COLUMN_ALIGN[col.align || 'left']} bg-base-700`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-base-600">
          {data.map((row) => (
            <tr
              key={row[rowKey]}
              className="hover:bg-base-700/30 transition-colors"
            >
              {columns.map((col) => {
                const cell = col.render ? col.render(row) : row[col.key]
                return (
                  <td
                    key={`${row[rowKey]}-${col.key}`}
                    className={`px-4 py-3.5 text-base-300 ${COLUMN_ALIGN[col.align || 'left']} border-t border-base-600/50`}
                  >
                    {cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { Table }
