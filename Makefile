install:
	npm install
lint:
	npx eslint .
test-coverage:
	npm test -- --coverage --coverageProvider=v8
build:
	NODE_ENV=production npx webpack
develop:
	npx webpack serve
test:
	npm test