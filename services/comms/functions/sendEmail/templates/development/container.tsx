import React from 'react'
import * as Templates from '../index'

export const Container = () => {
  const [template, setTemplate]: any = React.useState('')
  const [nonHtmlSupportText, setnonHtmlSupportText] = React.useState('')
  const renderTemplate = (t: any) => {
    setTemplate(
      React.createElement(t, {
        noHtml: true,
      })
    )

    setnonHtmlSupportText(t.getNonHtmlSupportText())
  }

  return (
    <div>
      <div
        style={{
          position: 'relative',
          width: '49%',
          display: 'inline-block',
          verticalAlign: 'top',
        }}
      >
        <h3>List of templates</h3>
        <div>
          <ul>
            {Object.keys(Templates).map((t: string, i: number) => (
              <li key={i}>
                <a
                  href={`#${(Templates as any)[t].getName()}`}
                  onClick={() => renderTemplate((Templates as any)[t])}
                >
                  {(Templates as any)[t].getName()}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        style={{ position: 'relative', width: '49%', display: 'inline-block' }}
      >
        <h3>Template View</h3>
        <div>{template}</div>
        <br />
        <br />
        <h3>Email text for non html email clients</h3>
        <div>{nonHtmlSupportText}</div>
      </div>
    </div>
  )
}
