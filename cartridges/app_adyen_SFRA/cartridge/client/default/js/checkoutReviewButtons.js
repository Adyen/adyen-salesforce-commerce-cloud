"use strict";

var helpers = require('./adyen_checkout/helpers');

/**
 * make payment details call for express payment methods from review page .
 * @param data - state data from adyen checkout component
 * @return {undefined}
 */
function makeExpressPaymentDetailsCall(data) {
  $.ajax({
    type: 'POST',
    url: window.makeExpressPaymentDetailsCall,
    data: JSON.stringify({
      data: data
    }),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success: function success(response) {
      helpers.setOrderFormData(response);
    },
    error: function error() {
      $.spinner().stop();
    }
  });
}

/**
 * initializes place order button on checkout review page.
 * @return {undefined}
 */
function initCheckoutReviewButtons() {
  $(document).ready(function () {
    $("button[name='place-order']").click(function () {
      $.spinner().start();
      var stateData = document.querySelector('#additionalDetailsHidden').value;
      makeExpressPaymentDetailsCall(JSON.parse(stateData));
      document.querySelector('#showConfirmationForm').submit();
    });
  });
}
initCheckoutReviewButtons();