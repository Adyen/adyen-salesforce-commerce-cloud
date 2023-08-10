const store = require('../../../../store');
const { renderGenericComponent } = require('./renderGenericComponent');
const helpers = require('./helpers');

function makePartialPayment(requestData) {
  let error;
  $.ajax({
    url: window.partialPaymentUrl,
    type: 'POST',
    data: JSON.stringify(requestData),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success(response) {
      if (response.error) {
        error = {
          error: true,
        };
      } else {
        const { giftCards, ...rest } = response;
        store.checkout.options.amount = rest.remainingAmount;
        store.partialPaymentsOrderObj = rest;
        sessionStorage.setItem('partialPaymentsObj', JSON.stringify(rest));
        store.addedGiftCards = giftCards;
        helpers.setOrderFormData(response);
        renderGenericComponent(true);
      }
    },
  }).fail(() => {});
  return error;
}

module.exports = {
  makePartialPayment,
};
