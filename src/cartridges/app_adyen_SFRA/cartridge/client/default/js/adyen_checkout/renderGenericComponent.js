/* eslint-disable no-unsafe-optional-chaining */
const store = require('../../../../store');
const { renderPaymentMethod } = require('./renderPaymentMethod');
const helpers = require('./helpers');
const constants = require('../constants');

function setCheckoutConfiguration(checkoutOptions) {
  const setField = (key, val) => val && { [key]: val };
  store.checkoutConfiguration = {
    ...store.checkoutConfiguration,
    ...setField('amount', checkoutOptions.amount),
    ...setField('countryCode', checkoutOptions.countryCode),
  };
}

function resolveUnmount(key, val) {
  try {
    return Promise.resolve(val.node.unmount(`component_${key}`));
  } catch (e) {
    // try/catch block for val.unmount
    return Promise.resolve(false);
  }
}

/**
 * To avoid re-rendering components twice, unmounts existing components from payment methods list
 */
function unmountComponents() {
  const promises = Object.entries(store.componentsObj).map(([key, val]) => {
    delete store.componentsObj[key];
    return resolveUnmount(key, val);
  });
  return Promise.all(promises);
}

function renderStoredPaymentMethod(imagePath) {
  return (pm) => {
    if (
      pm.supportedShopperInteractions.includes('Ecommerce') &&
      pm.type === constants.SCHEME
    ) {
      renderPaymentMethod(pm, true, imagePath);
    }
  };
}

function renderStoredPaymentMethods(data, imagePath) {
  if (data.length) {
    data.forEach(renderStoredPaymentMethod(imagePath));
  }
}

async function renderPaymentMethods(
  paymentMethods,
  imagePath,
  adyenDescriptions,
) {
  for (let i = 0; i < paymentMethods.length; i += 1) {
    const pm = paymentMethods[i];
    // eslint-disable-next-line
    await renderPaymentMethod(pm, false, imagePath, adyenDescriptions[pm.type]);
  }
}

export async function initializeCheckout(paymentMethodsResponse) {
  setCheckoutConfiguration(paymentMethodsResponse);

  store.checkoutConfiguration.paymentMethodsResponse = {
    ...paymentMethodsResponse.AdyenPaymentMethods,
    imagePath: paymentMethodsResponse.imagePath,
  };
  store.checkout = await window.AdyenWeb.AdyenCheckout(
    store.checkoutConfiguration,
  );

  document.querySelector('#paymentMethodsList').innerHTML = '';

  const paymentMethodsWithoutGiftCards =
    store.checkout.paymentMethodsResponse.paymentMethods.filter(
      (pm) => pm.type !== constants.GIFTCARD,
    );

  const storedPaymentMethodsWithoutGiftCards =
    store.checkout.paymentMethodsResponse.storedPaymentMethods.filter(
      (pm) => pm.type !== constants.GIFTCARD,
    );

  // Rendering stored payment methods if one-click is enabled in BM
  if (window.adyenRecurringPaymentsEnabled) {
    renderStoredPaymentMethods(
      storedPaymentMethodsWithoutGiftCards,
      paymentMethodsResponse.imagePath,
    );
  }

  await renderPaymentMethods(
    paymentMethodsWithoutGiftCards,
    paymentMethodsResponse.imagePath,
    paymentMethodsResponse.adyenDescriptions,
  );

  const firstPaymentMethod = document.querySelector(
    'input[type=radio][name=brandCode]',
  );
  if (firstPaymentMethod) {
    firstPaymentMethod.checked = true;
    helpers.displaySelectedMethod(firstPaymentMethod.value);
  }

  helpers.createShowConfirmationForm(
    window.ShowConfirmationPaymentFromComponent,
  );
}

/**
 * Calls getPaymentMethods and then renders the retrieved payment methods (including card component)
 */
async function renderGenericComponent(paymentMethodsResponse) {
  if (Object.keys(store.componentsObj).length !== 0) {
    await unmountComponents();
  }

  await initializeCheckout(paymentMethodsResponse);
}

module.exports = {
  renderGenericComponent,
  initializeCheckout,
  renderStoredPaymentMethods,
  renderPaymentMethods,
  resolveUnmount,
};
