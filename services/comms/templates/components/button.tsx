import React from 'react'
import { STYLES } from '../settings'

interface Props {
  text: string
  href: string
  buttonStyle?: {
    background?: string
    color?: string
    border?: string
  }
}

export class Button extends React.Component<Props> {
  render() {
    const { text, href, buttonStyle } = this.props

    return (
      <table
        cellPadding="0"
        cellSpacing="0"
        style={{ textAlign: 'center', border: '0' }}
      >
        <tbody>
          <tr>
            <td
              align="center"
              style={{
                borderRadius: '6px',
                fontSize: '16px',
                textAlign: 'left',
                backgroundColor:
                  buttonStyle?.background || STYLES.BUTTON_PRIMARY.background,
              }}
            >
              <a
                href={href}
                style={{
                  backgroundColor:
                    buttonStyle?.background || STYLES.BUTTON_PRIMARY.background,
                  border: `0px solid ${
                    buttonStyle?.border || STYLES.BUTTON_PRIMARY.border
                  }`,
                  borderRadius: '6px',
                  color: buttonStyle?.color || STYLES.BUTTON_PRIMARY.color,
                  display: 'inline-block',
                  fontSize: '14px',
                  fontWeight: 'normal',
                  letterSpacing: '0px',
                  lineHeight: 'normal',
                  padding: '12px 18px 12px 18px',
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
                target="_blank"
              >
                {text}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    )
  }
}
