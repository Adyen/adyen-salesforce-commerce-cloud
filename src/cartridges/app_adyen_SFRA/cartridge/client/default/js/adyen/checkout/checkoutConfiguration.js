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
    amount: amount || paymentMethodsResponse.amount,
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

// A Card remount in these Click to Pay states either starts identity
// validation again (a second OTP) or clears the OTP the shopper is typing.
const CLICK_TO_PAY_BUSY_STATES = [
  'Idle',
  'Loading',
  'ShopperIdentified',
  'OneTimePassword',
];

function getInstallmentOptions(cardConfig) {
  return cardConfig?.installmentOptions || {};
}

function canRemountCard(cardNode) {
  return (
    typeof cardNode?.update === 'function' &&
    !CLICK_TO_PAY_BUSY_STATES.includes(cardNode.clickToPayService?.state)
  );
}

/**
 * Installment options are filtered by amount when the card config is built, so
 * they only change when the new amount crosses a configured minimum. Updating
 * them needs a Card remount, which is skipped while Click to Pay is busy with
 * the shopper; the next full render picks up the new options then.
 */
function updateCardInstallments(previousConfig, nextConfig) {
  const nextOptions = getInstallmentOptions(nextConfig);
  const isChanged =
    JSON.stringify(getInstallmentOptions(previousConfig)) !==
    JSON.stringify(nextOptions);
  const cardNode = store.componentsObj?.scheme?.node;
  if (isChanged && canRemountCard(cardNode)) {
    cardNode.update({
      installmentOptions: nextOptions,
      showInstallmentAmounts: !!nextConfig?.showInstallmentAmounts,
    });
  }
}

async function updateCheckoutAmount(amount, email) {
  try {
    store.checkoutConfiguration = { ...store.checkoutConfiguration, amount };
    // Without shouldReinitializeCheckout: false, Adyen Web remounts every
    // component. Remounting the Card while Click to Pay is identifying the
    // shopper starts identity validation again and sends a second OTP.
    await store.checkout.update(
      { amount },
      { shouldReinitializeCheckout: false },
    );
    const previousCardConfig = store.paymentMethodsConfiguration?.scheme;
    store.paymentMethodsConfiguration = getPaymentMethodsConfiguration(
      email,
      amount,
      store.checkoutConfiguration.paymentMethodsResponse,
    );
    updateCardInstallments(
      previousCardConfig,
      store.paymentMethodsConfiguration.scheme,
    );
    return true;
  } catch (error) {
    $('body').trigger('checkout:renderPaymentMethod', { email, amount });
    return false;
  }
}

module.exports = {
  setCheckoutConfiguration,
  updateCheckoutAmount,
  actionHandler,
};
