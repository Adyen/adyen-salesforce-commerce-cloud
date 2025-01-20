const store = require('../../../../store');
const { initializeCheckout } = require('./renderGenericComponent');
const helpers = require('./helpers');

function makePartialPayment(requestData) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: window.partialPaymentUrl,
      type: 'POST',
      data: {
        csrf_token: $('#adyen-token').val(),
        data: JSON.stringify(requestData),
      },
    })
      .done((response) => {
        if (response.error) {
          reject(new Error(`Partial payment error ${response?.error}`));
        } else {
          const { giftCards, ...rest } = response;
          store.checkout.options.amount = rest.remainingAmount;
          store.adyenOrderDataCreated = rest.orderCreated;
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
