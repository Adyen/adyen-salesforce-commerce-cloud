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

function setAmazonPayConfig(adyenPaymentMethods) {
  const amazonpay = adyenPaymentMethods.paymentMethods.find(
    (paymentMethod) => paymentMethod.type === 'amazonpay',
  );
  if (amazonpay) {
    store.paymentMethodsConfiguration.amazonpay.configuration =
      amazonpay.configuration;
    store.paymentMethodsConfiguration.amazonpay.addressDetails = {
      name: `${document.querySelector('#shippingFirstNamedefault')?.value} ${
        document.querySelector('#shippingLastNamedefault')?.value
      }`,
      addressLine1: document.querySelector('#shippingAddressOnedefault')?.value,
      city: document.querySelector('#shippingAddressCitydefault')?.value,
      stateOrRegion: document.querySelector('#shippingAddressCitydefault')
        ?.value,
      postalCode: document.querySelector('#shippingZipCodedefault')?.value,
      countryCode: document.querySelector('#shippingCountrydefault')?.value,
      phoneNumber: document.querySelector('#shippingPhoneNumberdefault')?.value,
    };
  }
}

function setInstallments(amount) {
  try {
    const installmentLocales = ['pt_BR', 'ja_JP', 'tr_TR', 'es_MX'];
    if (installmentLocales.indexOf(window.Configuration.locale) < 0) {
      return;
    }
    const installments = JSON.parse(
      window.installments.replace(/&quot;/g, '"'),
    );
    if (installments.length) {
      store.paymentMethodsConfiguration.scheme.installmentOptions = {};
    }
    installments.forEach((installment) => {
      const [minAmount, numOfInstallments, cards] = installment;
      if (minAmount <= amount.value) {
        cards.forEach((cardType) => {
          const { installmentOptions } =
            store.paymentMethodsConfiguration.scheme;
          if (!installmentOptions[cardType]) {
            installmentOptions[cardType] = {
              values: [1],
            };
          }
          if (
            !installmentOptions[cardType].values.includes(numOfInstallments)
          ) {
            installmentOptions[cardType].values.push(numOfInstallments);
            installmentOptions[cardType].values.sort((a, b) => a - b);
          }
        });
      }
    });
    store.paymentMethodsConfiguration.scheme.showInstallmentAmounts = true;
  } catch (e) {} // eslint-disable-line no-empty
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

  setInstallments(paymentMethodsResponse.amount);
  setAmazonPayConfig(store.checkout.paymentMethodsResponse);
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
  setInstallments,
  setAmazonPayConfig,
  renderStoredPaymentMethods,
  renderPaymentMethods,
  resolveUnmount,
};
