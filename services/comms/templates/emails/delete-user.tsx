import React from 'react'
import { Html, Button, View, Paragraph } from '../components'

export function DeleteUserEmail() {
  return (
    <Html title="login to neighbourhood">
      <View>
        <Paragraph content={'Click the button below to login'} />
        <Button href={'https://deeplink'} text={'Click to login'} />
      </View>
    </Html>
  )
}

export const non_html_support_text = `Click below to log into neighbourhood.
Please click the link below if the button above does not work.\r\n\r\n
In case of any queries you can readch out to info@neighbourhod.com.\r\n
Please do not reply back to this email as we are unable to respond.`
