const store = require('../../../../store');
const { initializeCheckout } = require('./renderGenericComponent');
const helpers = require('./helpers');
const { httpClient } = require('../commons/httpClient');

function makePartialPayment(requestData) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const response = await httpClient({
      url: window.partialPaymentUrl,
      method: 'POST',
      data: {
        data: JSON.stringify(requestData),
      },
    });
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
  });
}

module.exports = {
  makePartialPayment,
};
