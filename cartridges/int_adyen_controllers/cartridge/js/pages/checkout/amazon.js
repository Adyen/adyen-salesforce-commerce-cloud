"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

if (window.amazonCheckoutSessionId) {
  var handleAuthorised = function handleAuthorised(response) {
    document.querySelector('#result').value = JSON.stringify({
      pspReference: response.fullResponse.pspReference,
      resultCode: response.fullResponse.resultCode,
      paymentMethod: response.fullResponse.paymentMethod ? response.fullResponse.paymentMethod : response.fullResponse.additionalData.paymentMethod
    });
    document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(response);
    document.querySelector('#showConfirmationForm').submit();
  };

  var handleError = function handleError() {
    document.querySelector('#result').value = JSON.stringify({
      error: true
    });
    document.querySelector('#paymentFromComponentStateData').value = JSON.stringify({
      error: true
    });
    document.querySelector('#showConfirmationForm').submit();
  };

  var handleAmazonResponse = function handleAmazonResponse(response, component) {
    if (response.fullResponse && response.fullResponse.action) {
      document.querySelector('.ui-widget-overlay').style.visibility = 'hidden';
      component.handleAction(response.fullResponse.action);
    } else if (response.resultCode === window.resultCodeAuthorised) {
      handleAuthorised(response);
    } else if (response.error) {
      handleError();
    }
  };

  var paymentFromComponent = function paymentFromComponent(data, component) {
    $.ajax({
      url: window.paymentFromComponentURL,
      type: 'post',
      contentType: 'application/; charset=utf-8',
      data: JSON.stringify(data),
      success: function success(response) {
        if (response.result && response.result.orderNo && response.result.orderToken) {
          document.querySelector('#orderToken').value = response.result.orderToken;
          document.querySelector('#merchantReference').value = response.result.orderNo;
        }

        handleAmazonResponse(response.result, component);
      }
    });
  };

  var amazonPayNode = document.getElementById('amazonContainerSG');
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
      paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: function onAdditionalDetails(state) {
      state.data.paymentMethod = 'amazonpay';
      $.ajax({
        type: 'post',
        url: window.paymentsDetailsURL,
        data: JSON.stringify(state.data),
        contentType: 'application/; charset=utf-8',
        success: function success(data) {
          if (data.response.isSuccessful) {
            handleAuthorised(data.response);
          } else if (!data.response.isFinal && _typeof(data.response.action) === 'object') {
            checkout.createFromAction(data.action).mount('#amazonContainerSG');
          } else {
            handleError();
          }
        }
      });
    }
  };
  var checkout = new AdyenCheckout(window.Configuration);
  var amazonPayComponent = checkout.create('amazonpay', amazonConfig).mount(amazonPayNode);
  amazonPayComponent.submit();
}