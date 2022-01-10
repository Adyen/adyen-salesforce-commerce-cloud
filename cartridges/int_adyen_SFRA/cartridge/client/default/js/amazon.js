"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var store = require('../../../store');

var helpers = require('./adyen_checkout/helpers');

var amazonPayNode = document.getElementById('amazon-container');
var checkout = new AdyenCheckout(window.Configuration);

function handleAuthorised(response) {
  var _response$fullRespons, _response$fullRespons2, _response$fullRespons3, _response$fullRespons4, _response$fullRespons5;

  document.querySelector('#result').value = JSON.stringify({
    pspReference: (_response$fullRespons = response.fullResponse) === null || _response$fullRespons === void 0 ? void 0 : _response$fullRespons.pspReference,
    resultCode: (_response$fullRespons2 = response.fullResponse) === null || _response$fullRespons2 === void 0 ? void 0 : _response$fullRespons2.resultCode,
    paymentMethod: (_response$fullRespons3 = response.fullResponse) !== null && _response$fullRespons3 !== void 0 && _response$fullRespons3.paymentMethod ? response.fullResponse.paymentMethod : (_response$fullRespons4 = response.fullResponse) === null || _response$fullRespons4 === void 0 ? void 0 : (_response$fullRespons5 = _response$fullRespons4.additionalData) === null || _response$fullRespons5 === void 0 ? void 0 : _response$fullRespons5.paymentMethod
  });
  document.querySelector('#showConfirmationForm').submit();
}

function handleError() {
  document.querySelector('#result').value = JSON.stringify({
    error: true
  });
  document.querySelector('#showConfirmationForm').submit();
}

function handleAmazonResponse(response, component) {
  var _response$fullRespons6;

  if ((_response$fullRespons6 = response.fullResponse) !== null && _response$fullRespons6 !== void 0 && _response$fullRespons6.action) {
    component.handleAction(response.fullResponse.action);
  } else if (response.resultCode === window.resultCodeAuthorised) {
    handleAuthorised(response);
  } else {
    // first try the amazon decline flow
    component.handleDeclineFlow(); // if this does not trigger a redirect, try the regular handleError flow

    handleError();
  }
}

function paymentFromComponent(data, component) {
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(data),
      paymentMethod: 'amazonpay'
    },
    success: function success(response) {
      if (response.orderNo) {
        document.querySelector('#merchantReference').value = response.orderNo;
      }

      handleAmazonResponse(response, component);
    }
  });
}

var amazonConfig = {
  showOrderButton: false,
  returnUrl: window.returnURL,
  configuration: {
    merchantId: window.amazonMerchantID,
    storeId: window.amazonStoreID,
    publicKeyId: window.amazonPublicKeyID
  },
  amazonCheckoutSessionId: window.amazonCheckoutSessionId,
  onSubmit: function onSubmit(state, component) {
    document.querySelector('#adyenStateData').value = JSON.stringify(state.data);
    document.querySelector('#additionalDetailsHidden').value = JSON.stringify(state.data);
    paymentFromComponent(state.data, component);
  },
  onAdditionalDetails: function onAdditionalDetails(state) {
    state.data.paymentMethod = 'amazonpay';
    $.ajax({
      type: 'post',
      url: window.paymentsDetailsURL,
      data: JSON.stringify(state.data),
      contentType: 'application/json; charset=utf-8',
      success: function success(data) {
        if (data.isSuccessful) {
          handleAuthorised(data);
        } else if (!data.isFinal && _typeof(data.action) === 'object') {
          checkout.createFromAction(data.action).mount('#amazon-container');
        } else {
          $('#action-modal').modal('hide');
          handleError();
        }
      }
    });
  }
};
var amazonPayComponent = checkout.create('amazonpay', amazonConfig).mount(amazonPayNode);
helpers.createShowConfirmationForm(window.ShowConfirmationPaymentFromComponent);
$('#dwfrm_billing').submit(function apiRequest(e) {
  e.preventDefault();
  var form = $(this);
  var url = form.attr('action');
  $.ajax({
    type: 'POST',
    url: url,
    data: form.serialize(),
    async: false,
    success: function success(data) {
      store.formErrorsExist = 'fieldErrors' in data;
    }
  });
});
$('#action-modal').modal({
  backdrop: 'static',
  keyboard: false
});
amazonPayComponent.submit();