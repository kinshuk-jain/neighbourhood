import React from 'react'
import { STYLES } from '../settings'

export function View({
  background = STYLES.VIEW.background,
  children,
}: {
  background?: string
  children: React.ReactNode
}) {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      style={{
        border: '0px',
        width: '100%',
        backgroundColor: background,
      }}
    >
      <tbody>
        <tr>
          <td valign="top" width="100%">
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  )
}
