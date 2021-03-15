#! /bin/sh

function display_usage {
  echo "Usage: $0 <invoke|run>"
  exit 1
}

COMMAND=$1

if ! [[ "$COMMAND" =~ ^(invoke|run)$ ]]; then
  display_usage
fi

sam --version; exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Please install sam cli and run this script again"
  echo "See how to install - https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
  exit 1
fi

yarn build

sam build --template-file sam_template.yml; exit_code=$?
if [ $exit_code -ne 0 ]; then
  echo "build failed: ${exit_code}"
  exit 1
fi

if [[ "$COMMAND" = "invoke" ]]; then
  sam local invoke "${@:3}" --env-vars "env.json"
elif [[ "$COMMAND" = "run" ]]; then
  sam local start-api "${@:3}" --env-vars "env.json"
fi
