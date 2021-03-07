import React from 'react'

export function Spacer() {
  return (
    <table
      className="spacer"
      role="spacer"
      data-type="spacer"
      cellPadding="0"
      cellSpacing="0"
      width="100%"
      style={{
        tableLayout: 'fixed',
        border: '0px',
        width: '100%',
      }}
    >
      <tbody>
        <tr>
          <td
            style={{ padding: '0px 0px 30px 0px' }}
            role="module-content"
          ></td>
        </tr>
      </tbody>
    </table>
  )
}
