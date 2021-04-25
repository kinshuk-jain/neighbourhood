import React from 'react'
import { Html, Button, View, Paragraph, Spacer } from '../components'

interface LoginEmailProps {
  noHtml?: boolean
}

export class LoginEmail extends React.Component {
  props: LoginEmailProps = {
    noHtml: false,
  }

  constructor(props: LoginEmailProps) {
    super(props)
  }

  static getDefaultSubject() {
    return 'Your login for neighbourhood.com'
  }

  static getName() {
    return 'LoginEmail'
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
        <Spacer />
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
