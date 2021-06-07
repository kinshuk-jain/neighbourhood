#! /bin/sh

rm -rf dist/

mkdir -p service-common

cp -R ../../service-common/dist/. service-common/

yarn install

tsc --build tsconfig-only-this.json 

cp -R package.json service-common dist/ 

rm -rf service-common
