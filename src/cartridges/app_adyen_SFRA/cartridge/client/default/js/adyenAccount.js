const { onFieldValid, onBrand, getPaymentMethods } = require('./commons');
const store = require('../../../store');
const { httpClient } = require('./commons/httpClient');

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
  return {
    showPayButton: false,
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
  };
}

async function initializeCardComponent() {
  const cardConfig = await initializeStoreConfiguration();
  const cardNode = document.getElementById('card');
  store.checkoutConfiguration.countryCode = window.countryCode;
  checkout = await window.AdyenWeb.AdyenCheckout(store.checkoutConfiguration);
  card = window.AdyenWeb.createComponent('scheme', checkout, cardConfig).mount(
    cardNode,
  );
}

// Handle Payment action
function handleAction(action) {
  checkout.createFromAction(action).mount('#action-container');
  $('#action-modal').modal({ backdrop: 'static', keyboard: false });
}

function handleError() {
  $('#action-modal')?.modal('hide');
  document.getElementById('cardError').style.display = 'block';
}

store.checkoutConfiguration.onAdditionalDetails = async (state) => {
  const requestData = JSON.stringify({ data: state.data });
  const data = await httpClient({
    method: 'POST',
    url: window.paymentsDetailsURL,
    data: {
      data: requestData,
    },
  });
  if (data.isSuccessful) {
    window.location.href = window.redirectUrl;
  } else if (!data.isFinal && typeof data.action === 'object') {
    handleAction(data.action);
  } else {
    handleError();
  }
};

function submitAddCard() {
  const form = $(document.getElementById('payment-form'));
  const formDataObject = form.serializeArray().reduce((obj, item) => {
    obj[item.name] = item.value;
    return obj;
  }, {});
  return httpClient({
    method: 'POST',
    url: form.attr('action'),
    data: formDataObject,
  });
}

async function handleAddNewPayment() {
  if (store.isValid) {
    document.querySelector('#adyenStateData').value = JSON.stringify(
      store.componentState.data,
    );
    const data = await submitAddCard();
    if (data.redirectAction) {
      handleAction(data.redirectAction);
    } else if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    } else if (data.error) {
      handleError();
    }
  } else {
    card?.showValidation();
  }
}

(async () => {
  await initializeCardComponent();
})();

$('button[value="add-new-payment"]').on('click', async (event) => {
  event.preventDefault();
  await handleAddNewPayment();
});

module.exports = {
  initializeCardComponent,
  handleAction,
  handleAddNewPayment,
};
