import PaymentMethodsPage from "../pages/PaymentMethodsPage";
import CheckoutPage from "../pages/CheckoutPage";
import {Selector, t} from "testcafe";

const paymentMethodsPage = new PaymentMethodsPage();
const checkoutPage = new CheckoutPage();

const doIdealPayment = async (testSuccess) => {
    await paymentMethodsPage.initiateIdealPayment(testSuccess);
    await checkoutPage.completeCheckout();
    await paymentMethodsPage.submitSimulator();
}

const doBillDeskPayment = async (paymentMethod, success) => {
    await paymentMethodsPage.initiateBillDeskPayment(paymentMethod);
    await checkoutPage.completeCheckout();
    await paymentMethodsPage.billdeskSimulator(success);
}

const doOneyPayment = async (shopper) => {
    await paymentMethodsPage.initiateOneyPayment(shopper);
    await checkoutPage.completeCheckout();
    await paymentMethodsPage.confirmOneyPayment();
}

const doKlarnaPayment = async (success) => {
    await paymentMethodsPage.initiateKlarnaPayment(null);
    await checkoutPage.completeCheckout();
    if(success){
        await paymentMethodsPage.confirmKlarnaPayment();
    }
    else {
        await paymentMethodsPage.cancelKlarnaPayment();
    }
}

const doKlarnaPayNowPayment = async (success) => {
    await paymentMethodsPage.initiateKlarnaPayment('paynow');
    await checkoutPage.completeCheckout();
    if(success){
        await paymentMethodsPage.confirmKlarnaPayNowPayment();
    }
    else{
        await paymentMethodsPage.cancelKlarnaPayment();
    }

}

const doKlarnaAccountPayment = async (success) => {
    await paymentMethodsPage.initiateKlarnaPayment('account');
    await checkoutPage.completeCheckout();
    if(success){
        await paymentMethodsPage.confirmKlarnaAccountPayment();
    }
    else {
        await paymentMethodsPage.cancelKlarnaPayment();
    }
}

const doGiropayPayment = async (paymentData, success) => {
    const giroPay = Selector('#rb_giropay');
    await giroPay()
    await t
        .click(giroPay)
    await checkoutPage.completeCheckout();
    if(success){
        await paymentMethodsPage.confirmGiropayPayment(paymentData);
    }
    else {
        await paymentMethodsPage.cancelGiropayPayment();
    }
}

const doEPSPayment = async (success) => {
    await paymentMethodsPage.initiateEPSPayment(success);
    await checkoutPage.completeCheckout();

    if(success){
        await paymentMethodsPage.confirmSimulator();
    }
    else {
        await paymentMethodsPage.cancelSimulator();
    }
}

const doAffirmPayment = async (shopper, success) => {
    await paymentMethodsPage.initiateAffirmPayment(shopper);
    await checkoutPage.completeCheckout();
    if(success){
        await paymentMethodsPage.confirmAffirmPayment();
    }
    else {
        await paymentMethodsPage.cancelAffirmPayment();
    }
}

const doVippsPayment = async (success) => {
    await t.click('#rb_vipps');
    await checkoutPage.completeCheckout();
    if(success) {
        await paymentMethodsPage.confirmVippsPayment();
    } else {
        await paymentMethodsPage.cancelVippsPayment();
    }
}

const doTrustlyPayment = async (success) => {
    await t.click('#rb_trustly');
    await checkoutPage.completeCheckout();
    if(success) {
        await paymentMethodsPage.confirmTrustlyPayment();
    } else {
        await paymentMethodsPage.cancelTrustlyPayment();
    }
}

const doMobilePayPayment = async () => {
    await t.click('#rb_mobilepay');
    await checkoutPage.completeCheckout();
    paymentMethodsPage.confirmMobilePayPayment();
}

module.exports = {
    doIdealPayment,
    doOneyPayment,
    doKlarnaPayment,
    doKlarnaAccountPayment,
    doKlarnaPayNowPayment,
    doGiropayPayment,
    doEPSPayment,
    doAffirmPayment,
    doVippsPayment,
    doTrustlyPayment,
    doMobilePayPayment,
    doBillDeskPayment,
}
