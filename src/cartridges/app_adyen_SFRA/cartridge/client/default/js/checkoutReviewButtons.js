const helpers = require('./adyen_checkout/helpers');
const { httpClient } = require('./commons/httpClient');

/**
 * make payment details call for express payment methods from review page .
 * @param data - state data from adyen checkout component
 * @return {undefined}
 */
async function makeExpressPaymentDetailsCall(data) {
  try {
    const response = await httpClient({
      method: 'POST',
      url: window.makeExpressPaymentDetailsCall,
      data: {
        data: JSON.stringify({ data }),
      },
    });
    helpers.setOrderFormData(response);
  } catch (error) {
    $.spinner().stop();
  }
}

/**
 * initializes place order button on checkout review page.
 * @return {undefined}
 */
function initCheckoutReviewButtons() {
  $(document).ready(() => {
    $("button[name='place-order']").click(() => {
      $.spinner().start();
      const stateData = document.querySelector(
        '#additionalDetailsHidden',
      ).value;
      makeExpressPaymentDetailsCall(JSON.parse(stateData));
      document.querySelector('#showConfirmationForm').submit();
    });
  });
}

initCheckoutReviewButtons();
