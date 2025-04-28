const store = require('../../../../../config/store');
const constants = require('../../../../../config/constants');
const { httpClient } = require('../../commons/httpClient');
const getPaymentMethodsConfiguration = require('./paymentMethodsConfiguration');

async function handleOnChange(state) {
  const { type } = state.data.paymentMethod;
  store.isValid = state.isValid;
  if (!store.componentsObj[type]) {
    store.componentsObj[type] = {};
  }
  store.componentsObj[type].isValid = store.isValid;
  store.componentsObj[type].stateData = state.data;
}

const actionHandler = async (action) => {
  const checkout = await window.AdyenWeb.AdyenCheckout(
    store.checkoutConfiguration,
  );
  checkout.createFromAction(action).mount('#action-container');
  $('#action-modal').modal({ backdrop: 'static', keyboard: false });
  if (action.type === constants.ACTIONTYPE.QRCODE) {
    document
      .getElementById('cancelQrMethodsButton')
      .classList.remove('invisible');
  }
};

async function handleOnAdditionalDetails(state) {
  const requestData = JSON.stringify({
    data: state.data,
    orderToken: window.orderToken,
  });
  const data = await httpClient({
    method: 'POST',
    url: window.paymentsDetailsURL,
    data: {
      csrf_token: $('#adyen-token').val(),
      data: requestData,
    },
  });
  if (!data.isFinal && typeof data.action === 'object') {
    await actionHandler(data.action);
  } else {
    window.location.href = data.redirectUrl;
  }
}

function setCheckoutConfiguration({ email, paymentMethodsResponse }) {
  const paymentMethodsConfiguration = getPaymentMethodsConfiguration(
    email,
    paymentMethodsResponse,
  );
  store.checkoutConfiguration.onChange = handleOnChange;
  store.checkoutConfiguration.onAdditionalDetails = handleOnAdditionalDetails;
  store.checkoutConfiguration.showPayButton = false;
  store.checkoutConfiguration.clientKey = window.adyenClientKey;
  store.paymentMethodsConfiguration = paymentMethodsConfiguration;
}

module.exports = {
  setCheckoutConfiguration,
  actionHandler,
};
