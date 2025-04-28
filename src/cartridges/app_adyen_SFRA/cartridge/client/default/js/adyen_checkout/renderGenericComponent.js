/* eslint-disable no-unsafe-optional-chaining */
const store = require('../../../../config/store');
const { renderPaymentMethod } = require('./renderPaymentMethod');
const helpers = require('./helpers');
const constants = require('../../../../config/constants');

function setCheckoutConfiguration(checkoutOptions) {
  const setField = (key, val) => val && { [key]: val };
  store.checkoutConfiguration = {
    ...store.checkoutConfiguration,
    ...setField('amount', checkoutOptions.amount),
    ...setField('countryCode', checkoutOptions.countryCode),
    ...setField('translations', checkoutOptions.adyenTranslations),
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

async function renderPaymentMethods(
  paymentMethods,
  isStored,
  imagePath,
  adyenDescriptions,
) {
  const promises = paymentMethods.map((pm) =>
    renderPaymentMethod(
      pm,
      isStored,
      imagePath,
      adyenDescriptions ? adyenDescriptions[pm.type] : null,
    ),
  );

  await Promise.all(promises);
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

  if (window.adyenRecurringPaymentsEnabled) {
    const storedSchemePaymentMethods =
      store.checkout.paymentMethodsResponse.storedPaymentMethods.filter(
        (pm) =>
          pm.type === constants.SCHEME &&
          pm.supportedShopperInteractions.includes('Ecommerce'),
      );
    await renderPaymentMethods(
      storedSchemePaymentMethods,
      true,
      paymentMethodsResponse.imagePath,
    );
  }

  const paymentMethodsWithoutGiftCards =
    store.checkout.paymentMethodsResponse.paymentMethods.filter(
      (pm) => pm.type !== constants.GIFTCARD,
    );
  await renderPaymentMethods(
    paymentMethodsWithoutGiftCards,
    false,
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
  renderPaymentMethods,
  resolveUnmount,
};
