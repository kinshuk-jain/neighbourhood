#! /bin/sh

function display_usage {
  echo "Usage: $0 <invoke|run> <create-contact|list-contact|delete-contact|get-contact|update-contact>"
  exit 1
}

FUNCTION=$2
COMMAND=$1

if ! [[ "$FUNCTION" =~ ^(create-contact|list-contact|delete-contact|get-contact|update-contact)$ && "$COMMAND" =~ ^(invoke|run)$ ]]; then
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

if [[ "$FUNCTION" =~ ^(update-contact)$ ]]; then
  function_name="updateContactFunction"
elif [[ "$FUNCTION" =~ ^(get-contact)$ ]]; then
  function_name="getContactFunction"
elif [[ "$FUNCTION" =~ ^(create-contact)$ ]]; then
  function_name="createContactFunction"
elif [[ "$FUNCTION" =~ ^(delete-contact)$ ]]; then
  function_name="deleteContactFunction"
elif [[ "$FUNCTION" =~ ^(list-contact)$ ]]; then
  function_name="listContactFunction"
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
