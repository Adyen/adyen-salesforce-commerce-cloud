import testNetherlands from "./countriesEUR/NL";
import testFrance from "./countriesEUR/FR";
import testGermany from "./countriesEUR/DE";
import testAustria from "./countriesEUR/AT";
import testPortugal from "./countriesEUR/PT";
import testBelgium from "./countriesEUR/BE";
import { regionsEnum } from "../data/enums"
import { environments } from "../data/environments"

for(const environment of environments) {
  const checkoutPage = new environment.CheckoutPage();
  fixture`${environment.name} EUR`
      .page(`https://${process.env.SFCC_HOSTNAME}${environment.urlExtension}`)
      .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
      })
      .beforeEach(async t => {
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
