/**
 * Invalidates the payment card form element in case specified status is ERROR.
 * If status is undefined or form is invalid the pipelet returns PIPELET_ERROR.
 *
 *  @input Status : dw.system.Status The status object.
 *  @input CreditCardForm : dw.web.FormGroup The credit card form.
 */

function execute(pdict) {
    var isInvalidated = invalidatePaymentCardForm(pdict.Status, pdict.CreditCardForm);

    if(!isInvalidated) {
        return PIPELET_ERROR;
    }

    return PIPELET_NEXT;
}

/**
 * Invalidates Payment Card Form
 *
 * @param {dw.system.Status} status - verification status of the credit card
 * @param {dw.web.Form} creditCardForm - The credit card form
 * @return {Boolean} - success status of invalidating payment card form
 */
function invalidatePaymentCardForm(status, creditCardForm) {
    var Status = require('dw/system/Status');
    var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');

    // verify that we have a status object and a valid credit card form
    if (!status || !creditCardForm.valid) {
        return false;
    }

    // we are fine, if status is OK
    if (status.status === Status.OK) {
        return true;
    }

    // invalidate the payment card form elements
    var items = status.items.iterator();
    while (items.hasNext()) {
        var item = items.next();

        switch(item.code) {
            case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                creditCardForm.number.setValue(creditCardForm.number.htmlValue);
                creditCardForm.number.invalidateFormElement();
                break;

            case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                creditCardForm.expiration.month.invalidateFormElement();
                creditCardForm.expiration.year.invalidateFormElement();
                break;

            case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                creditCardForm.cvn.invalidateFormElement();
        }
    }

    return true;
}

module.exports = {
    execute: execute,
    invalidatePaymentCardForm: invalidatePaymentCardForm
};
