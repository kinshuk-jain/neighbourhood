#! /bin/sh

rm -rf dist/

mkdir -p service-common

cp -R ../../service-common/dist/. service-common/

yarn install

tsc --build tsconfig-only-this.json 

cp -R package.json service-common dist/ 

node -e "const deps = require('./package.json'); deps.dependencies['service-common'] = 'file:./service-common'; require('fs').writeFileSync('./dist/package.json', JSON.stringify(deps))"

rm -rf service-common
