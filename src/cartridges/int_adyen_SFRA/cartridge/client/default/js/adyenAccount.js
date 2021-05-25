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
    },
  },
};
const checkout = new AdyenCheckout(store.checkoutConfiguration);
const card = checkout.create('card').mount(cardNode);

const submitAddCard = function submitAddCard() {
  const form = $(document.getElementById('payment-form'));
  $.ajax({
    type: 'POST',
    url: form.attr('action'),
    data: form.serialize(),
    async: false,
    success(data) {
      if (data.redirectAction) {
        checkout.createFromAction(data.redirectAction).mount(cardNode);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
  });
};

$('button[value="add-new-payment"]').on('click', (event) => {
  event.preventDefault();
  if (store.isValid) {
    document.querySelector('#adyenStateData').value = JSON.stringify(
      store.componentState.data,
    );
    submitAddCard();
  } else {
    card.showValidation();
    return false;
  }
  return true;
});
