const amazonPayNode = document.getElementById('amazon-container');

console.log(window.amazonCheckoutSessionId);
const amazonConfig = {
  showOrderButton: false,
  returnUrl: window.returnURL,
  configuration: {
    merchantId: 'AAUL9GPRGTX1U',
    storeId: 'amzn1.application-oa2-client.3e5db0a580f7468da2d9903dda981fce',
    publicKeyId: 'AGDRUNN37LQHSOCHN24AEYYB',
  },
  amount: {
    value: '23728',
    currency: 'GBP',
  },
  amazonCheckoutSessionId: window.amazonCheckoutSessionId,
  onSubmit: (state, component) => {
    console.log('onsubmit');
    console.log(state);
    // assignPaymentMethodValue();
    document.querySelector('#adyenStateData').value = JSON.stringify(
      state.data,
    );
    // document.querySelector('button[value="submit-payment"]').click();
    // $('#dwfrm_billing').trigger('submit');
    paymentFromComponent(state.data, component);
  },
};

const checkout = new AdyenCheckout(window.Configuration);
const amazonPayComponent = checkout
  .create('amazonpay', amazonConfig)
  .mount(amazonPayNode);

function paymentFromComponent(data, component) {
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: {
      data: JSON.stringify(data),
      paymentMethod: 'amazonpay',
    },
    success(response) {
      console.log(`respones is ${JSON.stringify(response)}`);
      if (response.orderNo) {
        // if (response.fullResponse?.merchantReference) {
        document.querySelector('#merchantReference').value =
          response.orderNo;
      }
      if (response.fullResponse?.action) {
        component.handleAction(response.fullResponse.action);
      } else if (response.resultCode === 'Authorised') {
        document.querySelector('#result').value = JSON.stringify({
          pspReference: response.fullResponse.pspReference,
          resultCode: response.fullResponse.resultCode,
          paymentMethod: response.fullResponse.additionalData.paymentMethod,
        });
        document.querySelector('#showConfirmationForm').submit();
      } else if(response.error) {
        document.querySelector('#result').value = JSON.stringify({
          error: true
        });
        document.querySelector('#showConfirmationForm').submit();
      }
    },
  }).fail(() => {
    console.log('failed!!');
  });
}

$('#dwfrm_billing').submit(function apiRequest(e) {
  console.log('submitted dwgfrm');
  e.preventDefault();

  const form = $(this);
  const url = form.attr('action');

  $.ajax({
    type: 'POST',
    url,
    data: form.serialize(),
    async: false,
    success(data) {
      store.formErrorsExist = 'fieldErrors' in data;
    },
  });
});
$('#action-modal').modal({ backdrop: 'static', keyboard: false });
amazonPayComponent.submit();
