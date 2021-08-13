const store = require('../../../store');

// creates a hidden form used post to order confirmation
function createFormField(fieldKey, fieldValue) {
  const formField = document.createElement('input');
  formField.type = 'hidden';
  formField.name = fieldKey;
  formField.value = fieldValue;
  return formField;
}

// handles payments API call and processes the response action
function doPaymentFromComponent(state, component) {
  $.ajax({
    url: window.configuration.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(state.data),
      paymentMethod: 'PayPal',
    },
    success(response) {
      window.configuration.merchantReference = response.orderNo;
      if (response.fullResponse && response.fullResponse.action) {
        component.handleAction(response.fullResponse.action);
      } else {
        document.getElementById('paymentError').style.display = 'block';
      }
    },
  }).fail(() => {
    document.getElementById('paymentError').style.display = 'block';
  });
}

// updates all checkboxes to the same checked state and enables/disables the express checkout components
function shippingAgreementUpdated() {
  // set all input checkboxes to enabled/disabled
  const agreementCheckboxes = document.getElementsByClassName('acceptShipping');
  for (
      let agreementCheckboxesIndex = 0;
      agreementCheckboxesIndex < agreementCheckboxes.length;
      agreementCheckboxesIndex += 1
  ) {
    agreementCheckboxes[agreementCheckboxesIndex].checked = this.checked;
  }
  // set all express components to enabled/disabled
  const expressComponents = document.getElementsByClassName('expressComponent');
  const disabledOverlayClass = 'disabled';
  for (
    let expressComponentsIndex = 0;
    expressComponentsIndex < expressComponents.length;
    expressComponentsIndex += 1
  ) {
    if (this.checked) {
      expressComponents[expressComponentsIndex].classList.remove(
        disabledOverlayClass,
      );
    } else {
      expressComponents[expressComponentsIndex].classList.add(
        disabledOverlayClass,
      );
    }
  }
}

// store configuration
store.checkoutConfiguration.amount = window.configuration.amount;
store.checkoutConfiguration.environment = window.configuration.environment;
store.checkoutConfiguration.paymentMethodsConfiguration = {
  paypal: {
    onAdditionalDetails: (state) => {
      const onAdditionalDetailsForm = document.createElement('form');
      onAdditionalDetailsForm.method = 'POST';
      onAdditionalDetailsForm.action = window.configuration.showConfirmationURL;
      onAdditionalDetailsForm.appendChild(
        createFormField('additionalDetailsHidden', JSON.stringify(state.data)),
      );
      onAdditionalDetailsForm.appendChild(
        createFormField('merchantReference', window.configuration.merchantReference),
      );
      document.body.appendChild(onAdditionalDetailsForm);
      onAdditionalDetailsForm.submit();
    },
    onSubmit: (state, component) => {
      doPaymentFromComponent(state, component);
    },
    onCancel: () => {
      $.ajax({
        url: window.configuration.paymentFromComponentURL,
        type: 'post',
        data: {
          data: JSON.stringify({
            cancelTransaction: true,
            merchantReference: window.configuration.merchantReference,
          }),
        },
        complete() {
          document.getElementById('paymentError').style.display = 'block';
        },
      });
    },
  },
};

// initial page setup run when the page has fully loaded
$(document).ready(() => {
  // address consent checkbox handling
  $('.acceptShipping').change(shippingAgreementUpdated);

  // card and checkout component creation
  const expressCheckoutNodes = document.getElementsByClassName(
    'expressComponent',
  );
  const checkout = new AdyenCheckout(store.checkoutConfiguration);
  for (
    let expressCheckoutNodesIndex = 0;
    expressCheckoutNodesIndex < expressCheckoutNodes.length;
    expressCheckoutNodesIndex += 1
  ) {
    if (window.configuration.isPayPalExpressEnabled) {
      checkout
        .create('paypal')
        .mount(expressCheckoutNodes[expressCheckoutNodesIndex]);
    }
  }
});
