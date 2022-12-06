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

// updates all checkboxes to the same checked state. Enable/disable the express checkout components
//function shippingAgreementUpdated() {
//  // set all input checkboxes to enabled/disabled
//  const agreementCheckboxes = document.getElementsByClassName('acceptShipping');
//  for (
//    let agreementCheckboxesIndex = 0;
//    agreementCheckboxesIndex < agreementCheckboxes.length;
//    agreementCheckboxesIndex += 1
//  ) {
//    agreementCheckboxes[agreementCheckboxesIndex].checked = this.checked;
//  }
//  // set all express components to enabled/disabled
//  const expressComponents = document.getElementsByClassName('expressComponent');
//  const disabledOverlayClass = 'disabled';
//  for (
//    let expressComponentsIndex = 0;
//    expressComponentsIndex < expressComponents.length;
//    expressComponentsIndex += 1
//  ) {
//    if (this.checked) {
//      expressComponents[expressComponentsIndex].classList.remove(
//        disabledOverlayClass,
//      );
//    } else {
//      expressComponents[expressComponentsIndex].classList.add(
//        disabledOverlayClass,
//      );
//    }
//  }
//}


// initial page setup run when the page has fully loaded
$(document).ready(() => {
    console.log('ready!');

// store configuration
store.checkoutConfiguration.amount = window.configuration.amount;
//store.checkoutConfiguration.environment = window.configuration.environment;
store.checkoutConfiguration.environment = "TEST";

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
        createFormField(
          'merchantReference',
          window.configuration.merchantReference,
        ),
      );
      document.body.appendChild(onAdditionalDetailsForm);
      onAdditionalDetailsForm.submit();
    },
    onClick: (data, actions) => {
        console.log('onclick!');
    },
    onError: (error, component) => {
        console.log('inside onerror');
        console.log(error.toString())
      if (component) {
        component.setStatus('ready');
      }
    },
    onSubmit: (state, component) => {
        console.log('onsubmit');
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
  // address consent checkbox handling
//  $('.acceptShipping').change(shippingAgreementUpdated);

  // card and checkout component creation
//  const expressCheckoutNode = document.getElementsByClassName(
//    'expressComponent',
//  );
    setTimeout(async () => {
       AdyenCheckout(store.checkoutConfiguration)
        .then( checkout => {
         const expressCheckoutNode = document.querySelector('#expressComponent');
         checkout.create('paypal').mount(expressCheckoutNode);
        })
        .catch(e => {
        console.log('inside catch')
        console.log(e.toString())
        })
    }, 1000);

//  for (
//    let expressCheckoutNodesIndex = 0;
//    expressCheckoutNodesIndex < expressCheckoutNodes.length;
//    expressCheckoutNodesIndex += 1
//  ) {
//    if (window.configuration.isPayPalExpressEnabled) {
//    }
//  }
});
