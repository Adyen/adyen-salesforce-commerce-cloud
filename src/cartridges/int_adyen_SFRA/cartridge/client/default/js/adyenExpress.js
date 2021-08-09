
const store = require('../../../store');

let checkout;

function createFormField(fieldKey, fieldValue) {
  const formField = document.createElement('input');
  formField.type = 'hidden';
  formField.name = fieldKey;
  formField.value = fieldValue;
  return formField;
}
// Store configuration
store.checkoutConfiguration.amount = window.amount;
store.checkoutConfiguration.environment = window.environment;
store.checkoutConfiguration.paymentMethodsConfiguration = {
  paypal: {
    onAdditionalDetails: (state) => {
      const onAdditionalDetailsForm = document.createElement('form');
      onAdditionalDetailsForm.method = 'POST';
      onAdditionalDetailsForm.action = window.showConfirmationURL;
      onAdditionalDetailsForm.appendChild(createFormField('additionalDetailsHidden', JSON.stringify(state.data)));
      onAdditionalDetailsForm.appendChild(createFormField('merchantReference', window.merchantReference));
      document.body.appendChild(onAdditionalDetailsForm);
      onAdditionalDetailsForm.submit();
    },
    onSubmit: (state, component) => {
      $.ajax({
        url: window.paymentFromComponentURL,
        type: 'post',
        data: {
          data: JSON.stringify(state.data),
          paymentMethod: 'PayPal',
        },
        success(response) {
          window.merchantReference = response.orderNo;
          if (response.fullResponse && response.fullResponse.action) {
            component.handleAction(response.fullResponse.action);
          } else {
            document.getElementById('paymentError').style.display = 'block';
          }
        },
      }).fail(() => {
        document.getElementById('paymentError').style.display = 'block';
      });
    },
    onCancel: () => {
      $.ajax({
        url: window.paymentFromComponentURL,
        type: 'post',
        data: {
          data: JSON.stringify({
            cancelTransaction: true,
            merchantReference: window.merchantReference
          })
        },
        complete() {
          document.getElementById('paymentError').style.display = 'block';
        },
      });

}
  }
}

// card and checkout component creation
const expressCheckoutNode = document.getElementById('expressComponent');
checkout = new AdyenCheckout(store.checkoutConfiguration);
checkout.create('paypal').mount(expressCheckoutNode);