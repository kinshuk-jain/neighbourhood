#! /bin/sh

function display_usage {
  echo "Usage: $0 <invoke|run> <list-society|create-society|delete-society|read-society|update-society>"
  exit 1
}

FUNCTION=$2
COMMAND=$1

if ! [[ "$FUNCTION" =~ ^(list-society|create-society|delete-society|read-society|update-society)$ && "$COMMAND" =~ ^(invoke|run)$ ]]; then
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

if [[ "$FUNCTION" =~ ^(create-society)$ ]]; then
  function_name="createSocietyFunction"
elif [[ "$FUNCTION" =~ ^(read-society)$ ]]; then
  function_name="readSocietyFunction"
elif [[ "$FUNCTION" =~ ^(update-society)$ ]]; then
  function_name="updateSocietyFunction"
elif [[ "$FUNCTION" =~ ^(delete-society)$ ]]; then
  function_name="deleteSocietyFunction"
elif [[ "$FUNCTION" =~ ^(list-society)$ ]]; then
  function_name="listSocietyFunction"
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
