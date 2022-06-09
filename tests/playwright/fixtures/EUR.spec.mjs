import testNetherlands from './countriesEUR/NL.mjs';
import testFrance from './countriesEUR/FR.mjs';
import testGermany from './countriesEUR/DE.mjs';
import testAustria from './countriesEUR/AT.mjs';
import testPortugal from './countriesEUR/PT.mjs';
import testBelgium from './countriesEUR/BE.mjs';
import { regionsEnum } from '../data/enums.mjs';
import { environments } from '../data/environments.mjs';

for (const environment of environments) {
  const checkoutPage = new environment.CheckoutPage(page);
  fixture`${environment.name} EUR`
    .page(`https://${process.env.SFCC_HOSTNAME}${environment.urlExtension}`)
    .httpAuth({
      username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
      password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    })
    .beforeEach(async (t) => {
      // create full cart and go to checkout
      await t.maximizeWindow();
      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);
    });

  testNetherlands(checkoutPage);
  testFrance(checkoutPage);
  testGermany(checkoutPage);
  testAustria(checkoutPage);
  testPortugal(checkoutPage);
  testBelgium(checkoutPage, environment);
}
