const store = require('../../../store');
console.log('here')
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
        console.log('not success')
//        document.getElementById('paymentError').style.display = 'block';
      }
    },
  }).fail(() => {
          console.log('inside fail')
//    document.getElementById('paymentError').style.display = 'block';
  });
}

async function mountPayPalComponent() {
  const session = await fetch(window.sessionsUrl);
  const sessionData = await session.json();

  const shippingMethods = await fetch(window.shippingMethodsUrl);
  const shippingMethodsData = await shippingMethods.json();
  console.log('shippingMethodsData ' + JSON.stringify(shippingMethodsData));
  const environment = 'test';

  const paypalConfig = {
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
            window.merchantReference,
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
          url: window.paymentFromComponentURL,
          type: 'post',
          data: {
            data: JSON.stringify({
              cancelTransaction: true,
              merchantReference: window.merchantReference,
            }),
          },
          complete() {
            document.getElementById('paymentError').style.display = 'block';
          },
        });
      },
      onShippingChange: function(data, actions) {
        console.log('inside onshipping change');
        console.log(data);
        console.log(actions);
      },
    };


  const checkout = await AdyenCheckout({
    environment,
    clientKey: window.clientKey,
    locale: window.locale,
    session: sessionData,
    amount: window.amount,
  });

  const paypalComponent = checkout.create('paypal', paypalConfig);
    paypalComponent.mount('#paypal-container');
}

mountPayPalComponent();