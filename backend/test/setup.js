require('dotenv').config();

if (!process.env.DB_NAME || !process.env.DB_NAME.endsWith('_test')) {
  throw new Error('Refusing to run tests: DB_NAME must end in _test (got: ' + process.env.DB_NAME + ')');
}
