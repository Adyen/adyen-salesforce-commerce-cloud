import {t} from "testcafe";

const ideal = async () => {
    await t
        .wait(3000)
        .click(this.idealRadioButton)
        .click(this.iDealInput)
        .click(this.iDealDropDown)
        .click(this.iDealDropDownListElement);
    await this.submitPayment();
    await t.wait(3000);
    await this.placeOrder();
    await this.continueOnHPP();
}

module.exports = {
    ideal,
}