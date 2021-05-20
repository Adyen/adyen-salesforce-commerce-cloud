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

$('button[value="add-new-payment"]').on('click', () => {
  if (store.isValid) {
    document.querySelector('#adyenStateData').value = JSON.stringify(
      store.componentState.data,
    );
    return true;
  }
  card.showValidation();
  return false;
});
