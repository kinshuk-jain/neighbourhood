import React from 'react'
import { Html, Button, View, Paragraph } from '../components'

interface DeleteUserEmailProps {
  noHtml?: boolean
}

export class DeleteUserEmail extends React.Component {
  props: DeleteUserEmailProps = {
    noHtml: false,
  }

  constructor(props: DeleteUserEmailProps) {
    super(props)
  }

  static getName() {
    return 'DeleteUserEmailProps'
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
