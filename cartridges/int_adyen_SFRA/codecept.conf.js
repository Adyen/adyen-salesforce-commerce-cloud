exports.config = {
  tests: './tests/*_test.js',
  output: './output',
  helpers: {
      Puppeteer: {
        url: 'https://adyen02-tech-prtnr-eu04-dw.demandware.net',
        chrome: {
          executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        },
        windowSize: '1440x700',
        show: true,
        waitForNavigation: ['networkidle0', 'domcontentloaded'],
          waitForAction: 750,
          waitForTimeout: 5000
     }
  },
  include: {
    I: './customsteps.js'
  },
  bootstrap: null,
  mocha: {},
  name: 'workspace'
}
