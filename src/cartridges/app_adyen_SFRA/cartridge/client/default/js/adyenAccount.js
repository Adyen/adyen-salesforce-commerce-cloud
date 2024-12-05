const { onFieldValid, onBrand, getPaymentMethods } = require('./commons');
const store = require('../../../store');

let checkout;
let card;

// Store configuration
store.checkoutConfiguration.amount = {
  value: 0,
  currency: 'EUR',
};

async function initializeStoreConfiguration() {
  const paymentMethodsData = await getPaymentMethods();
  const paymentMethodsResponse = paymentMethodsData.AdyenPaymentMethods;
  const cardBrands = paymentMethodsResponse.paymentMethods
    .filter((method) => method.type === 'scheme')
    .flatMap((method) => method.brands || []);

  store.checkoutConfiguration.paymentMethodsConfiguration = {
    card: {
      enableStoreDetails: false,
      hasHolderName: true,
      holderNameRequired: true,
      installments: [],
      onBrand,
      onFieldValid,
      brands: cardBrands,
      onChange(state) {
        store.isValid = state.isValid;
        store.componentState = state;
      },
    },
  };
}

async function initializeCardComponent() {
  const cardNode = document.getElementById('card');
  checkout = await AdyenCheckout(store.checkoutConfiguration);
  card = checkout.create('card').mount(cardNode);
}

// Handle Payment action
function handleAction(action) {
  checkout.createFromAction(action).mount('#action-container');
  $('#action-modal').modal({ backdrop: 'static', keyboard: false });
}

store.checkoutConfiguration.onAdditionalDetails = (state) => {
  const requestData = JSON.stringify({ data: state.data });
  $.ajax({
    type: 'POST',
    url: window.paymentsDetailsURL,
    data: {
      csrf_token: $('#adyen-token').val(),
      data: requestData,
    },
    async: false,
    success(data) {
      if (data.isSuccessful) {
        window.location.href = window.redirectUrl;
      } else if (!data.isFinal && typeof data.action === 'object') {
        handleAction(data.action);
      } else {
        $('#action-modal').modal('hide');
        document.getElementById('cardError').style.display = 'block';
      }
    },
  });
};

let formErrorsExist = false;

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
        formErrorsExist = true;
      }
    },
  });
}

(async () => {
  await initializeStoreConfiguration();
  await initializeCardComponent();
})();

$('button[value="add-new-payment"]').on('click', (event) => {
  if (store.isValid) {
    document.querySelector('#adyenStateData').value = JSON.stringify(
      store.componentState.data,
    );
    submitAddCard();
    if (formErrorsExist) {
      return;
    }
    event.preventDefault();
  } else {
    card?.showValidation();
  }
});

module.exports = {
  initializeCardComponent,
  submitAddCard,
};
