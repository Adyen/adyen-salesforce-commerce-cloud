import PaymentMethodsPage from "../pages/PaymentMethodsPage";
import CheckoutPage from "../pages/CheckoutPage";
import {Selector, t} from "testcafe";

const paymentMethodsPage = new PaymentMethodsPage();
const checkoutPage = new CheckoutPage();

const doIdealPayment = async (testSuccess) => {
    await paymentMethodsPage.initiateIdealPayment(testSuccess);
    await checkoutPage.completeCheckout();
    await paymentMethodsPage.submitIdealSimulator();
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

const doGiropayPayment = async (success) => {
    await t
        .click(Selector('#rb_giropay'))
    await checkoutPage.completeCheckout();
    if(success){
        await paymentMethodsPage.confirmGiropayPayment();
    }
    else {
        await paymentMethodsPage.cancelGiropayPayment();
    }
}

const doEPSPayment = async (success) => {
    await t
        .click(Selector('#rb_eps'))
    await checkoutPage.completeCheckout();
    if(success){
        await paymentMethodsPage.confirmEPSPayment();
    }
    else {
        await paymentMethodsPage.cancelEPSPayment();
    }
}

const doAffirmPayment = async (success) => {
    await t
        .click(Selector('#rb_affirm'))
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
}
