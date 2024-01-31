const store = require('../../../../store');
const { initializeCheckout } = require('./renderGenericComponent');
const helpers = require('./helpers');

function makePartialPayment(requestData) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: window.partialPaymentUrl,
      type: 'POST',
      data: JSON.stringify(requestData),
      contentType: 'application/json; charset=utf-8',
    })
      .done((response) => {
        if (response.error) {
          reject(new Error(`Partial payment error ${response?.error}`));
        } else {
          const { giftCards, ...rest } = response;
          store.checkout.options.amount = rest.remainingAmount;
          store.adyenOrderData = rest.partialPaymentsOrder;
          store.partialPaymentsOrderObj = rest;
          sessionStorage.setItem('partialPaymentsObj', JSON.stringify(rest));
          store.addedGiftCards = giftCards;
          helpers.setOrderFormData(response);
          initializeCheckout();
          resolve();
        }
      })
      .fail(() => {
        reject(new Error('makePartialPayment request failed'));
      });
  });
}

module.exports = {
  makePartialPayment,
};
