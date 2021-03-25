#!/bin/bash -e

function display_usage {
  echo "Usage: $0 <staging|production>"
  exit 1
}

FOLDER=$1

if ! [[ "$FOLDER" =~ ^(staging|production)$ ]]; then
  display_usage
fi


openssl genrsa -des3 -out ../config/$FOLDER/private.pem 2048

openssl rsa -in ../config/$FOLDER/private.pem -outform PEM -pubout -out ../config/$FOLDER/public.pem