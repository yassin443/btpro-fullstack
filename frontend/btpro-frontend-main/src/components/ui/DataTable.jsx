// columns: [{ key, label, align?: 'right'|'center', mono?: boolean, render?: (value, row) => ReactNode }]
// rows: any[]
// emptyMsg: string
export function DataTable({ columns = [], rows = [], emptyMsg = 'Aucune donnée', className = '' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className={`tbl ${className}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ textAlign: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left' }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 18px' }}>
                {emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.id ?? i}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      col.align === 'right' ? 'r' : '',
                      col.mono ? 'num' : '',
                      col.ref ? 'ref' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
