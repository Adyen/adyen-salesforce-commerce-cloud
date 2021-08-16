"use strict";

var store = require('../../../store');

var amazonPayNode = document.getElementById('amazon-container');

function handleAmazonResponse(response, component) {
  var _response$fullRespons;

  if ((_response$fullRespons = response.fullResponse) !== null && _response$fullRespons !== void 0 && _response$fullRespons.action) {
    component.handleAction(response.fullResponse.action);
  } else if (response.resultCode === 'Authorised') {
    document.querySelector('#result').value = JSON.stringify({
      pspReference: response.fullResponse.pspReference,
      resultCode: response.fullResponse.resultCode,
      paymentMethod: response.fullResponse.additionalData.paymentMethod
    });
    document.querySelector('#showConfirmationForm').submit();
  } else if (response.error) {
    document.querySelector('#result').value = JSON.stringify({
      error: true
    });
    document.querySelector('#showConfirmationForm').submit();
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
  }
};
var checkout = new AdyenCheckout(window.Configuration);
var amazonPayComponent = checkout.create('amazonpay', amazonConfig).mount(amazonPayNode);
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