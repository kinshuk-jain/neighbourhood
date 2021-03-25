#! /bin/sh

function display_usage {
  echo "Usage: $0 <deploy> <send-public-key|sign-out|generate-login-token|verify-login-token>"
  exit 1
}

FUNCTION=$2
COMMAND=$1

if ! [[ "$FUNCTION" =~ ^(send-public-key|sign-out|generate-login-token|verify-login-token)$ && "$COMMAND" =~ ^(deploy)$ ]]; then
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

if [[ "$FUNCTION" =~ ^(generate-login-token)$ ]]; then
  function_name="generateLoginTokenFunction"
elif [[ "$FUNCTION" =~ ^(sign-out)$ ]]; then
  function_name="signOutFunction"
elif [[ "$FUNCTION" =~ ^(verify-login-token)$ ]]; then
  function_name="verifyLoginTokenFunction"
else
elif [[ "$FUNCTION" =~ ^(send-public-key)$ ]]; then
  function_name="sendPublicKeyFunction"
else
  display_usage
fi

sam validate --template-file sam_template.yml; exit_code=$?
if [ $exit_code -ne 0 ]; then
  echo "sam template not valid: ${exit_code}"
  exit 1
fi

sam build --template-file sam_template.yml $function_name; exit_code=$?
if [ $exit_code -ne 0 ]; then
  echo "build failed: ${exit_code}"
  exit 1
fi

sam deploy --guided
