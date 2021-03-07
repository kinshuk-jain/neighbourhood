import React from 'react'

export function Paragraph({ content }: { content: string }) {
  return (
    <table
      role="module"
      data-type="text"
      cellPadding="0"
      cellSpacing="0"
      width="100%"
      style={{ tableLayout: 'fixed', border: '0px' }}
    >
      <tbody>
        <tr>
          <td
            style={{
              padding: '10px 0px 10px 0px',
              backgroundColor: '#EFE',
              lineHeight: '20px',
              textAlign: 'inherit',
            }}
            height="100%"
            valign="top"
            role="module-content"
          >
            <div
              style={{
                fontFamily: 'inherit',
                textAlign: 'inherit',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontFamily: 'helvetica, sans-serif',
                }}
              >
                {content}
              </span>
            </div>
            <br />
          </td>
        </tr>
      </tbody>
    </table>
  )
}
