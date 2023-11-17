An app to structure recipe data in a more cooking friendly way.

## Setup:
* `npm install`
* create postgres databases for parsley and parsley_test
* `npx prisma db push` --> sync database to models
* create a .env file with **DATABASE_URL** key for the development database
* create a .env.test file with **DATABASE_URL** for the test database

## Commands:
* `npm run dev` --> transpiles to js and runs the program with nodemon
* `npm test` --> Handles migrations and runs tests