import CheckoutPage from "../pages/CheckoutPage";
import testNetherlands from "./countriesEUR/NL";
import testFrance from "./countriesEUR/FR";
import testGermany from "./countriesEUR/DE";
import testAustria from "./countriesEUR/AT";
import testPortugal from "./countriesEUR/PT";
import testBelgium from "./countriesEUR/BE";
import { regionsEnum } from "../data/enums"

fixture`EUR`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home`)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    })
    .beforeEach( async t => {
        // create full cart and go to checkout
        const checkoutPage = new CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.EU);

    });

testNetherlands();
testFrance();
testGermany();
testAustria();
testPortugal();
testBelgium();