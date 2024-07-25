import { test } from '@playwright/test';
import { regionsEnum } from '../data/enums.mjs';
import { environments } from '../data/environments.mjs';
import { Cards } from '../paymentFlows/cards.mjs';
import { ShopperData } from '../data/shopperData.mjs';
import { CardData } from '../data/cardData.mjs';
import { PresentToShoppers } from '../paymentFlows/presentToShopper.mjs';

const shopperData = new ShopperData();
const cardData = new CardData();

let checkoutPage;
let accountPage;
let cards;

for (const environment of environments) {
  test.describe.parallel(`${environment.name} BRL`, () => {

    test.beforeEach(async ({ page }) => {
      await page.goto(`${environment.urlExtension}`);
      checkoutPage = new environment.CheckoutPage(page);
      accountPage = new environment.AccountPage(page);
      cards = new Cards(page);

      await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.BR);
      await checkoutPage.setShopperDetails(shopperData.BR);
      if (environment.name.indexOf('v5') !== -1) {
        await checkoutPage.setEmail();
      }
    });

    test('Card payment 3DS2 installments success @quick', async () => {
      await cards.doCardPaymentInstallments(cardData.threeDs2, 4);
      await checkoutPage.completeCheckout();
      await cards.do3Ds2Verification();
      await checkoutPage.expectSuccess();
    });

    test('Card payment 3DS2 installments failure', async () => {
      const cardDataInvalid = Object.assign({}, cardData.threeDs2);
      cardDataInvalid.expirationDate = '0150';
      await cards.doCardPaymentInstallments(cardDataInvalid, 2);
      await checkoutPage.completeCheckout();
      await cards.do3Ds2Verification();
      await checkoutPage.expectRefusal();
    });

    // Boleto sandbox needs to be fixed
    test.fixme('Boleto Success', async ({ page }) => {
      await new PresentToShoppers(page).doBoletoPayment();
      await checkoutPage.completeCheckout();
      await checkoutPage.expectVoucher();
    });
  });
}
