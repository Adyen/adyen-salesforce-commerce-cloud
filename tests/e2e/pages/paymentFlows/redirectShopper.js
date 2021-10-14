import {Selector, t} from "testcafe";




const ideal = async () => {
    const idealRadioButton = Selector('#rb_ideal');
    const iDealInput = Selector('input[value="ideal"]');
    const iDealDropDown = Selector('#component_ideal .adyen-checkout__dropdown__button');
    const iDealDropDownList = Selector('#component_ideal .adyen-checkout__dropdown__list');
    const iDealDropDownListElement = Selector('#component_ideal .adyen-checkout__dropdown__list li');
    const iDealContinueButtonOnHPP = Selector('input[type="submit"]');

    await t.takeScreenshot({fullPage:true});
    await t
        .wait(4200)
        .click(idealRadioButton)
        .click(iDealInput)
        .click(iDealDropDown)
        .click(iDealDropDownListElement);
    await this.submitPayment();
    await this.placeOrder();
    await this.continueOnHPP();
}

module.exports = {
    ideal,
}
