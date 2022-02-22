const store = require('../../../../store');
const { renderPaymentMethod } = require('./renderPaymentMethod');
const helpers = require('./helpers');

function addPosTerminals(terminals) {
  const ddTerminals = document.createElement('select');
  ddTerminals.id = 'terminalList';
  Object.keys(terminals).forEach((t) => {
    const option = document.createElement('option');
    option.value = terminals[t];
    option.text = terminals[t];
    ddTerminals.appendChild(option);
  });
  document.querySelector('#adyenPosTerminals').append(ddTerminals);
}

/**
 * Makes an ajax call to the controller function GetPaymentMethods
 */
function getPaymentMethods(paymentMethods) {
  $.ajax({
    url: window.getPaymentMethodsURL,
    type: 'get',
    success(data) {
      paymentMethods(data);
    },
  });
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

function renderStoredPaymentMethod(data) {
  return (pm) => {
    if (pm.supportedShopperInteractions.includes('Ecommerce')) {
      renderPaymentMethod(pm, true, data.ImagePath);
    }
  };
}

function renderStoredPaymentMethods(data) {
  if (data.AdyenPaymentMethods.storedPaymentMethods) {
    const { storedPaymentMethods } = store.checkout.paymentMethodsResponse;
    storedPaymentMethods.forEach(renderStoredPaymentMethod(data));
  }
}

function renderPaymentMethods(data) {
  data.AdyenPaymentMethods.paymentMethods.forEach((pm, i) => {
    renderPaymentMethod(
      pm,
      false,
      data.ImagePath,
      data.AdyenDescriptions[i].description,
    );
  });
}

function renderPosTerminals(data) {
  const removeChilds = () => {
    const posTerminals = document.querySelector('#adyenPosTerminals');
    while (posTerminals.firstChild) {
      posTerminals.removeChild(posTerminals.firstChild);
    }
  };

  if (data.AdyenConnectedTerminals?.uniqueTerminalIds?.length) {
    removeChilds();
    addPosTerminals(data.AdyenConnectedTerminals.uniqueTerminalIds);
  }
}

function setCheckoutConfiguration(data) {
  const setField = (key, val) => val && { [key]: val };
  store.checkoutConfiguration = {
    ...store.checkoutConfiguration,
    ...setField('amount', data.amount),
    ...setField('countryCode', data.countryCode),
  };
}

function setAmazonPayConfig(adyenPaymentMethods) {
  const amazonpay = adyenPaymentMethods.paymentMethods.find(
    (paymentMethod) => paymentMethod.type === 'amazonpay',
  );
  if (amazonpay) {
    store.checkoutConfiguration.paymentMethodsConfiguration.amazonpay.configuration =
      amazonpay.configuration; // eslint-disable-line max-len
    store.checkoutConfiguration.paymentMethodsConfiguration.amazonpay.addressDetails = {
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
    const [minAmount, numOfInstallments] = window.installments
      ?.replace(/\[|]/g, '')
      .split(',');
    if (minAmount <= amount.value) {
      store.checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions = {
        card: {},
      }; // eslint-disable-next-line max-len
      store.checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions.card.values = helpers.getInstallmentValues(
        numOfInstallments,
      );
      store.checkoutConfiguration.paymentMethodsConfiguration.card.showInstallmentAmounts = true;
    }
  } catch (e) {} // eslint-disable-line no-empty
}

/**
 * Calls getPaymenMethods and then renders the retrieved payment methods (including card component)
 */
module.exports.renderGenericComponent = async function renderGenericComponent() {
  if (Object.keys(store.componentsObj).length !== 0) {
    await unmountComponents();
  }
  getPaymentMethods((data) => {
    store.checkoutConfiguration.paymentMethodsResponse =
      data.AdyenPaymentMethods;
    setCheckoutConfiguration(data);
    setAmazonPayConfig(data.AdyenPaymentMethods);
    setInstallments(data.amount);
    store.checkout = new AdyenCheckout(store.checkoutConfiguration);

    document.querySelector('#paymentMethodsList').innerHTML = '';

    renderStoredPaymentMethods(data);
    renderPaymentMethods(data);
    renderPosTerminals(data);

    const firstPaymentMethod = document.querySelector(
      'input[type=radio][name=brandCode]',
    );
    firstPaymentMethod.checked = true;
    helpers.displaySelectedMethod(firstPaymentMethod.value);
  });
  helpers.createShowConfirmationForm(
    window.ShowConfirmationPaymentFromComponent,
  );
};
