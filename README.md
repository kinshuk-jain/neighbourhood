uses yarn workspaces

Cannot have shared packages with aws sam till this is merged - https://github.com/aws/aws-lambda-builders/pull/215

add sns access to comms lambda, comms to have sendnotification
contacts module
skip sending email link for alias authentication

Create common cloudformation for

- SES - create receipt rules, create domains etc
- SNS - create topics
- KMS - create key
