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
}

store.checkoutConfiguration.onAdditionalDetails = (state) =>{
  $.ajax({
    type: 'POST',
    url: 'Adyen-PaymentsDetails',
    data: JSON.stringify(state.data),
    contentType: "application/json; charset=utf-8",
    async: false,
    success(data) {
      if(data.action) {
        return handleAction(data.action);
      }
      if (['Authorised', 'Canceled'].indexOf(data.resultCode) === -1) {
        const errorDiv = $(document.getElementById('form-error'));
        errorDiv.removeAttr('hidden');
        errorDiv.text(data.refusalReason);
      } else {
        window.location.href = window.redirectUrl;
      }
    },
  });
};
const checkout = new AdyenCheckout(store.checkoutConfiguration);
const card = checkout.create('card').mount(cardNode);

function handleAction(action) {
  checkout.createFromAction(action).mount('#action-container');
  $("#action-modal").modal({ backdrop: 'static', keyboard: false });
}

function submitAddCard() {
  const form = $(document.getElementById('payment-form'));
  $.ajax({
    type: 'POST',
    url: form.attr('action'),
    data: form.serialize(),
    async: false,
    success(data) {
      if (data.redirectAction) {
        handleAction(data.redirectAction);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.error) {
        const errorDiv = $(document.getElementById('form-error'));
        errorDiv.removeAttr('hidden');
        errorDiv.text(data.error);
      }
    },
  });
}

$('button[value="add-new-payment"]').on('click', (event) => {
  event.preventDefault();
  if (store.isValid) {
    document.querySelector('#adyenStateData').value = JSON.stringify(
      store.componentState.data,
    );
    submitAddCard();
  } else {
    card.showValidation();
  }
});
