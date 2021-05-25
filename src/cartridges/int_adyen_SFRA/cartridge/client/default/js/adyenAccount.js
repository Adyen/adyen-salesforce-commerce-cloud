const { onFieldValid, onBrand } = require('./commons/index');
const store = require('../../../store');

const cardNode = document.getElementById('card');
store.checkoutConfiguration.amount = {
  value: 0,
  currency: 'EUR',
};
store.checkoutConfiguration.paymentMethodsConfiguration = {
  card: {
    enableStoreDetails: false,
    hasHolderName: true,
    holderNameRequired: true,
    installments: [],
    onBrand,
    onFieldValid,
    onChange(state) {
      store.isValid = state.isValid;
      store.componentState = state;
    }
  },
};
const checkout = new AdyenCheckout(store.checkoutConfiguration);
const card = checkout.create('card').mount(cardNode);


const doAddCardCall = function(form) {
  const url = form.attr('action');
  $.ajax({
    type: 'POST',
    url,
    data: form.serialize(),
    async: false,
    success(data) {
      if(data.redirectAction) {
        checkout.createFromAction(data.redirectAction).mount(cardNode);
      } else if(data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    }
  });
}

$('.payment-form').submit(function apiRequest(event) {
  event.preventDefault();
  if (store.isValid) {
    document.querySelector('#adyenStateData').value = JSON.stringify(
        store.componentState.data,
    );
    const form = $(this);
    doAddCardCall(form);
  }
  else {
    card.showValidation();
    return false;
  }
});

// $('button[value="add-new-payment"]').on('click', () => {
//   if (store.isValid) {
//     document.querySelector('#adyenStateData').value = JSON.stringify(
//       store.componentState.data,
//     );
//     return true;
//   }
//   card.showValidation();
//   return false;
// });
