"use strict";

if (window.amazonCheckoutSessionId) {
  var handleAmazonResponse = function handleAmazonResponse(response, component) {
    if (response.fullResponse && response.fullResponse.action) {
      component.handleAction(response.fullResponse.action);
    } else if (response.resultCode === 'Authorised') {
      document.querySelector('#result').value = JSON.stringify({
        pspReference: response.fullResponse.pspReference,
        resultCode: response.fullResponse.resultCode,
        paymentMethod: response.fullResponse.additionalData.paymentMethod
      });
      document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(response);
      document.querySelector('#showConfirmationForm').submit();
    } else if (response.error) {
      document.querySelector('#result').value = JSON.stringify({
        error: true
      });
      $('#dwfrm_billing').trigger('submit');
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

  var amazonPayNode = document.getElementById('amazon-container');
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
    }
  };
  var checkout = new AdyenCheckout(window.Configuration);
  var amazonPayComponent = checkout.create('amazonpay', amazonConfig).mount(amazonPayNode);
  amazonPayComponent.submit();
}