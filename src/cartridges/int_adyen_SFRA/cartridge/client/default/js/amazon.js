const amazonPayNode = document.getElementById('amazon-container');

console.log(window.amazonCheckoutSessionId)
const amazonConfig = {
  showPayButton: false,
  productType: 'PayOnly',
  checkoutMode: 'ProcessOrder',
  returnUrl: window.returnURL,
  // configuration: {
  //   merchantId: "AAUL9GPRGTX1U",
  //   storeId: "amzn1.application-oa2-client.3e5db0a580f7468da2d9903dda981fce",
  //   publicKeyId: "AGDRUNN37LQHSOCHN24AEYYB"
  // },
  amount: {
    value: "88800",
    currency: "GBP"
  },
  amazonCheckoutSessionId: window.amazonCheckoutSessionId,
  onSubmit: (state, component) => {
    // assignPaymentMethodValue();
    console.log("Submit amazon pay 2nd call");
    document.querySelector('#adyenStateData').value = JSON.stringify(
        state.data,
    );
    $('#dwfrm_billing').trigger('submit');
    // paymentFromComponent(state.data, component);
  },
};

// $('#dwfrm_billing').submit(function (e) {
//     e.preventDefault();
//     var form = $(this);
//     var url = form.attr('action');
//
//     $.ajax({
//       type: 'POST',
//       url: url,
//       data: form.serialize(),
//       async: false,
//       success: function (data) {
//         formErrorsExist = data.fieldErrors;
//       },
//     });
// });

const checkout = new AdyenCheckout(window.Configuration);
checkout.create('amazonpay', amazonConfig).mount(amazonPayNode);
