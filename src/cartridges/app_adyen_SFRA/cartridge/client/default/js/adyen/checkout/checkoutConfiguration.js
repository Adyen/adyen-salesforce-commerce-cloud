const store = require('../../../../../config/store');
const constants = require('../../../../../config/constants');
const { httpClient } = require('../commons/httpClient');
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
  $('#action-container').spinner().start();
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
  $('#action-container').spinner().stop();
}

async function setCheckoutConfiguration({
  email,
  paymentMethodsResponse,
  amount,
}) {
  const { countryCode, AdyenPaymentMethods, imagePath, adyenTranslations } =
    paymentMethodsResponse;
  const paymentMethodsConfiguration = getPaymentMethodsConfiguration(
    email,
    amount || paymentMethodsResponse.amount,
    paymentMethodsResponse.AdyenPaymentMethods,
  );
  store.checkoutConfiguration = {
    ...store.checkoutConfiguration,
    showPayButton: false,
    onChange: handleOnChange,
    onAdditionalDetails: handleOnAdditionalDetails,
    clientKey: window.adyenClientKey,
    translations: adyenTranslations,
    amount: paymentMethodsResponse.amount,
    countryCode,
    paymentMethodsResponse: {
      ...AdyenPaymentMethods,
      imagePath,
    },
  };
  store.paymentMethodsConfiguration = paymentMethodsConfiguration;
  store.checkout = await window.AdyenWeb.AdyenCheckout(
    store.checkoutConfiguration,
  );
}

module.exports = {
  setCheckoutConfiguration,
  actionHandler,
};
