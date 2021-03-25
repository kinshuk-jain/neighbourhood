#!/bin/bash -eu

# This function prints the usage
function usage {
  {
    echo "Usage:"
    echo "   ${BASH_SOURCE[0]} <NAME> <VALUE> <KEY_ID>"
    echo "      NAME   - the name of the SSM variable"
    echo "      VALUE  - the unencrypted secret"
    echo "      KEY_ID - the key-id for the KMS CMK"
  } >&2
}

# Confirm that there are at least two arguments
if [ "$#" -lt 3 ]; then
  usage
  exit 1
fi

# Confirm that we have the AWS cli
if ! [ -x "$(command -v "aws")" ]; then
  echo "Error: The aws-cli is not on the path. Perhaps it is not installed?"
  exit 1
fi

NAME=$1
VALUE=$2
KEY_ID=$3

aws ssm put-parameter  \
    --type String      \
    --name "$NAME"     \
    --value $(aws kms encrypt --output text --query CiphertextBlob --key-id "$KEY_ID" --plaintext "$VALUE")
