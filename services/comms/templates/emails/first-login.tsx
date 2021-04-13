import React from 'react'
import { Html, Button, View, Paragraph } from '../components'

interface FistLoginEmailProps {
  noHtml?: boolean
}

export class FistLoginEmail extends React.Component {
  props: FistLoginEmailProps = {
    noHtml: false,
  }

  constructor(props: FistLoginEmailProps) {
    super(props)
  }

  static getName() {
    return 'FistLoginEmail'
  }

  static getNonHtmlSupportText() {
    return `Click below to log into neighbourhood.
    Please click the link below if the button above does not work.\r\n\r\n
    In case of any queries you can readch out to info@neighbourhod.com.\r\n
    Please do not reply back to this email as we are unable to respond.`
  }

  renderComponent() {
    return (
      <View>
        <Paragraph content={'Click the button below to login'} />
        <Button href={'https://deeplink'} text={'Click to login'} />
      </View>
    )
  }

  render() {
    return this.props.noHtml ? (
      this.renderComponent()
    ) : (
      <Html title="login to neighbourhood">{this.renderComponent()}</Html>
    )
  }
}
