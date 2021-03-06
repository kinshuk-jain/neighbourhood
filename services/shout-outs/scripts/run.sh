#! /bin/sh

function display_usage {
  echo "Usage: $0 <invoke|run> <create|list|delete|get|update|create-reply|update-reply|delete-reply|get-reply|update-name>"
  exit 1
}

FUNCTION=$2
COMMAND=$1

if ! [[ "$FUNCTION" =~ ^(create|list|delete|get|update|create-reply|update-reply|delete-reply|get-reply|update-name)$ && "$COMMAND" =~ ^(invoke|run)$ ]]; then
  display_usage
fi

sam --version; exit_code=$?

if [ $exit_code -ne 0 ]; then
  echo "Please install sam cli and run this script again"
  echo "See how to install - https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
  exit 1
fi

script_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$script_path"
cd "../functions/$FUNCTION" && yarn build
cd ../../

if [[ "$FUNCTION" =~ ^(update)$ ]]; then
  function_name="updateFunction"
elif [[ "$FUNCTION" =~ ^(get)$ ]]; then
  function_name="getFunction"
elif [[ "$FUNCTION" =~ ^(create)$ ]]; then
  function_name="createFunction"
elif [[ "$FUNCTION" =~ ^(delete)$ ]]; then
  function_name="deleteFunction"
elif [[ "$FUNCTION" =~ ^(list)$ ]]; then
  function_name="listFunction"
elif [[ "$FUNCTION" =~ ^(create-reply)$ ]]; then
  function_name="createReplyFunction"
elif [[ "$FUNCTION" =~ ^(update-reply)$ ]]; then
  function_name="updateReplyFunction"
elif [[ "$FUNCTION" =~ ^(delete-reply)$ ]]; then
  function_name="deleteReplyFunction"
elif [[ "$FUNCTION" =~ ^(get-reply)$ ]]; then
  function_name="getReplyFunction"
elif [[ "$FUNCTION" =~ ^(update-name)$ ]]; then
  function_name="updateNameFunction"
else
  display_usage
fi

sam build --template-file sam_template.yml $function_name; exit_code=$?
if [ $exit_code -ne 0 ]; then
  echo "build failed: ${exit_code}"
  exit 1
fi

if [[ "$COMMAND" = "invoke" ]]; then
  sam local invoke $function_name "${@:3}" --env-vars "env.json"
elif [[ "$COMMAND" = "run" ]]; then
  sam local start-api "${@:3}" --env-vars "env.json"
fi
