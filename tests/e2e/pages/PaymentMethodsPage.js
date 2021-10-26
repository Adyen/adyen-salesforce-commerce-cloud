import {Selector, t} from "testcafe";

const shopperData = require("../data/shopperData.json");

export default class PaymentMethodsPage {

    initiateIdealPayment = async (testSuccess) => {
        const iDealInput = Selector('input[value="ideal"]');
        const iDealDropDown = Selector('#component_ideal .adyen-checkout__dropdown__button');
        const issuer = testSuccess ? Selector('#component_ideal .adyen-checkout__dropdown__list li') : Selector('#component_ideal li[data-value="1160"]');

        await t
            .click(Selector('#rb_ideal'))
            .click(iDealInput)
            .click(iDealDropDown)
            .click(issuer);
    }

    submitIdealSimulator = async () => {
        await t
            .click(Selector('input[type="submit"]'));
    }

    initiateMultiBancoPayment = async () => {
        const multibancoInput = Selector('input[value="multibanco"]');
        await t
            .click(multibancoInput)
    }

    initiateMBWayPayment = async () => {
        const mbwayInput = Selector('input[value="mbway"]');
        const mbwayButton = Selector('#component_mbway button');
        await t
            .click(mbwayInput)
            .click(mbwayButton)
    }

    initiateBoletoPayment = async () => {
        const socialSecurityInput = Selector('input[name="socialSecurityNumber"]');
        await t
            .click(Selector('#rb_boletobancario'))
            .typeText(socialSecurityInput, "56861752509")
    }

    MultiBancoVoucherExists = async () => {
        return Selector('.adyen-checkout__voucher-result--multibanco').exists;
    }
}