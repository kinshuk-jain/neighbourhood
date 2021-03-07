import React from 'react'
import { STYLES } from '../settings'

interface Props {
  title: string
  charset?: string
  backgroundColor?: string
  styleBlock?: string
  children:
    | React.ReactNode
    | React.ReactElement
    | React.ReactNode[]
    | React.ReactElement[]
}

export class Html extends React.Component<Props> {
  static defaultProps = {
    backgroundColor: STYLES.BACKGROUND_COLOR,
    charset: 'utf-8',
  }

  _createMarkup() {
    return `
      <meta http-equiv="Content-Type" content="text/html; charset=${this.props.charset}" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta content="telephone=no" name="format-detection" />

      <title>${this.props.title}</title>

      <!--[if !mso]><!-->
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <!--<![endif]-->

      <!--[if (gte mso 9)|(IE)]>
        <style type="text/css">table {border-collapse: collapse;}</style>
      <![endif]-->

      <style type="text/css">
        div[style*="margin: 16px 0"] { margin:0 !important; }
      </style>

      ${this.props.styleBlock}
    `
  }

  render() {
    const { backgroundColor } = this.props

    const bodyStyle = {
      backgroundColor: backgroundColor,
      margin: '0 !important',
      padding: '0px',
      minHeight: '600px',
    }

    return (
      <html>
        <head
          title={this.props.title}
          dangerouslySetInnerHTML={{ __html: this._createMarkup() }}
        />
        <body style={bodyStyle}>
          {`<!--[if mso]>
            <center>
              <table>
                <tr>
                  <td width="600">
          <![endif]-->`}
          {this.props.children}
          {`<!--[if mso]>
                  </td>
                </tr>
              </table>
            </center>
          <![endif]-->`}
        </body>
      </html>
    )
  }
}
