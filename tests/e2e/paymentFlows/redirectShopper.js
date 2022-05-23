import PaymentMethodsPage from "../pages/PaymentMethodsPage";
import {Selector, t} from "testcafe";
const paymentMethodsPage = new PaymentMethodsPage();

const doIdealPayment = async (testSuccess) => {
    await paymentMethodsPage.initiateIdealPayment(testSuccess);
}

const completeIdealRedirect = async () => {
    await paymentMethodsPage.submitSimulator();
}

const doBillDeskPayment = async (paymentMethod) => {
    await paymentMethodsPage.initiateBillDeskPayment(paymentMethod);
}

const completeBillDeskRedirect = async (success) => {
    await paymentMethodsPage.billdeskSimulator(success);
}

const doOneyPayment = async (shopper) => {
    await paymentMethodsPage.initiateOneyPayment(shopper);
}

const completeOneyRedirect = async (shopper) => {
    await paymentMethodsPage.confirmOneyPayment();
}

const doKlarnaPayment = async () => {
    await paymentMethodsPage.initiateKlarnaPayment(null);
}

const completeKlarnaRedirect = async (success) => {
    if(success){
        await paymentMethodsPage.confirmKlarnaPayment();
    }
    else {
        await paymentMethodsPage.cancelKlarnaPayment();
    }
}

const completeKlarnaRedirectWithIDNumber = async (success) => {
    if(success){
        await paymentMethodsPage.confirmKlarnaPaymentWithIDNumber();
    }
    else {
        await paymentMethodsPage.cancelKlarnaPayment();
    }
}

const doKlarnaPayNowPayment = async () => {
    await paymentMethodsPage.initiateKlarnaPayment('paynow');
}

const completeKlarnaPayNowRedirect = async (success) => {
    if(success){
        await paymentMethodsPage.confirmKlarnaPayNowPayment();
    }
    else{
        await paymentMethodsPage.cancelKlarnaPayment();
    }

}

const doKlarnaAccountPayment = async () => {
    await paymentMethodsPage.initiateKlarnaPayment('account');
}

const completeKlarnaAccountRedirect = async (success) => {
    if(success){
        await paymentMethodsPage.confirmKlarnaAccountPayment();
    }
    else {
        await paymentMethodsPage.cancelKlarnaPayment();
    }
}

const doGiropayPayment = async () => {
    const giroPay = Selector('#rb_giropay');
    await giroPay()
    await t
        .click(giroPay)
}

const completeGiropayRedirect = async (paymentData, success) => {
    if(success){
        await paymentMethodsPage.confirmGiropayPayment(paymentData);
    }
    else {
        await paymentMethodsPage.cancelGiropayPayment();
    }
}

const doEPSPayment = async () => {
    await paymentMethodsPage.initiateEPSPayment(success);
}

const completeEPSRedirect = async (success) => {
    if(success){
        await paymentMethodsPage.confirmSimulator();
    }
    else {
        await paymentMethodsPage.cancelSimulator();
    }
}

const doAffirmPayment = async (shopper) => {
    await paymentMethodsPage.initiateAffirmPayment(shopper);
}

const completeAffirmRedirect = async () => {
    await paymentMethodsPage.cancelAffirmPayment();
}

const doVippsPayment = async () => {
    await t.click('#rb_vipps');

}

const completeVippsRedirect = async (success)  => {
    if(success) {
        await paymentMethodsPage.confirmVippsPayment();
    } else {
        await paymentMethodsPage.cancelVippsPayment();
    }
}

const doTrustlyPayment = async () => {
    await t.click('#rb_trustly');
}

const completeTrustlyRedirect = async (success) => {
    if(success) {
        await paymentMethodsPage.confirmTrustlyPayment();
    } else {
        await paymentMethodsPage.cancelTrustlyPayment();
    }
}

const doMobilePayPayment = async () => {
    await t.click('#rb_mobilepay');
}

const completeMobilePayRedirect = async () => {
    await paymentMethodsPage.confirmMobilePayPayment();
}

module.exports = {
    doIdealPayment,
    completeIdealRedirect,
    doOneyPayment,
    completeOneyRedirect,
    doKlarnaPayment,
    completeKlarnaRedirect,
    completeKlarnaRedirectWithIDNumber,
    doKlarnaAccountPayment,
    completeKlarnaAccountRedirect,
    doKlarnaPayNowPayment,
    completeKlarnaPayNowRedirect,
    doGiropayPayment,
    completeGiropayRedirect,
    doEPSPayment,
    completeEPSRedirect,
    doAffirmPayment,
    completeAffirmRedirect,
    doVippsPayment,
    completeVippsRedirect,
    doTrustlyPayment,
    completeTrustlyRedirect,
    doMobilePayPayment,
    completeMobilePayRedirect,
    doBillDeskPayment,
    completeBillDeskRedirect,
}
