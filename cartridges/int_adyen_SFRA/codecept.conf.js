exports.config = {
  tests: './tests/*_test.js',
  output: './output',
  helpers: {
    TestCafe: {
      url: 'https://adyen02-tech-prtnr-eu04-dw.demandware.net',
      show: true,
    }
  },
  include: {
    I: './customsteps.js'
  },
  bootstrap: null,
  mocha: {},
  name: 'workspace'
}
