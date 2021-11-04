// import { regionsEnum } from "../data/enums";
// import CheckoutPage from "../pages/CheckoutPage";
// import {
//   doCardPaymentInstallments,
//   do3Ds2Verification,
// } from "../paymentFlows/cards";
// import {doBoletoPayment} from "../paymentFlows/presentToShopper";
// const shopperData = require("../data/shopperData.json");
// const cardData = require("../data/cardData.json") ;
//
// let checkoutPage;
//
// fixture`BRL`
//     .page(`https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=${regionsEnum.BR}`)
//     .httpAuth({
//         username: 'storefront',
//         password: 'fGMxsfjLwb3XtZ2gqKyZ3m4h7J',
//     })
//     .beforeEach( async t => {
//       await t.maximizeWindow()
//       checkoutPage = new CheckoutPage();
//       await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.BR);
//       await checkoutPage.setShopperDetails(shopperData.BR);
//     });
//
// test('Card payment 3DS2 installments success', async () => {
//   await doCardPaymentInstallments(cardData.threeDs2 , 4);
//   await do3Ds2Verification();
//   await checkoutPage.expectSuccess();
// });
//
// test('Card payment 3DS2 installments failure', async () => {
//   const cardDataInvalid = cardData.threeDs2;
//   cardDataInvalid.expirationDate = '0150';
//   await doCardPaymentInstallments(cardDataInvalid, 2);
//   await do3Ds2Verification();
//   await checkoutPage.expectFailure();
// });
//
// test('Boleto Success', async t => {
//     // const checkoutPage = new CheckoutPage();
//     // await checkoutPage.goToCheckoutPageWithFullCart(regionsEnum.BR);
//
//     // await checkoutPage.setShopperDetails(shopperData.BR);
//
//     await doBoletoPayment();
//     await checkoutPage.expectVoucher();
// });
//
// test('Boleto Fail', async t => {
//
// });
