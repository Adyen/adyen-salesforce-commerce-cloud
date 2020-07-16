exports.config = {
  tests: './tests/*_test.js',
  output: './output',
  helpers: {
    TestCafe: {
      url: 'https://www.yourstorefront.com',
      show: true,
    },
  },
  include: {
    I: './customsteps.js',
  },
  bootstrap: null,
  mocha: {},
  name: 'workspace',
};
