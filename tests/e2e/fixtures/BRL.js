import { regionsEnum } from "../data/enums";
import { environments } from "../data/environments"
import {
  doCardPaymentInstallments,
  do3Ds2Verification,
} from "../paymentFlows/cards";
import { doBoletoPayment } from "../paymentFlows/presentToShopper";
const shopperData = require("../data/shopperData.json");
const cardData = require("../data/cardData.json") ;

let checkoutPage;

for(const environment of environments) {
  fixture`${environment.name} BRL`
      .page(`https://${process.env.SFCC_HOSTNAME}${environment.urlExtension}`)
      .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
      })
      .beforeEach( async t => {
        await t.maximizeWindow()
        checkoutPage = new environment.CheckoutPage();
        await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.BR);
        await checkoutPage.setShopperDetails(shopperData.BR);
      });

  test('Card payment 3DS2 installments success', async () => {
    await doCardPaymentInstallments(cardData.threeDs2 , 4);
    await checkoutPage.completeCheckout();
    await do3Ds2Verification();
    await checkoutPage.expectSuccess();
  });

  test('Card payment 3DS2 installments failure', async () => {
    const cardDataInvalid = Object.assign({}, cardData.threeDs2);
    cardDataInvalid.expirationDate = '0150';
    await doCardPaymentInstallments(cardDataInvalid, 2);
    await checkoutPage.completeCheckout();
    await do3Ds2Verification();
    await checkoutPage.expectRefusal();
  });

  test.skip('Boleto Success', async t => {
    await doBoletoPayment();
    await checkoutPage.completeCheckout();
    await checkoutPage.expectVoucher();
  });
}
