/* eslint-disable no-unsafe-optional-chaining */
const store = require('../../../../store');
const { renderPaymentMethod } = require('./renderPaymentMethod');
const helpers = require('./helpers');
const { installmentLocales } = require('./localesUsingInstallments');
const {
  getPaymentMethods,
  fetchGiftCards,
  getConnectedTerminals,
} = require('../commons');
const constants = require('../constants');
const {
  createElementsToShowRemainingGiftCardAmount,
  removeGiftCards,
  renderAddedGiftCard,
  showGiftCardWarningMessage,
  attachGiftCardAddButtonListener,
  showGiftCardInfoMessage,
  giftCardBrands,
  clearGiftCardsContainer,
  attachGiftCardCancelListener,
  showGiftCardCancelButton,
} = require('./renderGiftcardComponent');

const INIT_CHECKOUT_EVENT = 'INIT_CHECKOUT_EVENT';

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

function isCartModified(amount, orderAmount) {
  return (
    amount.currency !== orderAmount.currency ||
    amount.value !== orderAmount.value
  );
}

function renderGiftCardLogo(imagePath) {
  const headingImg = document.querySelector('#headingImg');
  if (headingImg) {
    headingImg.src = `${imagePath}genericgiftcard.png`;
  }
}
function applyGiftCards() {
  const now = new Date().toISOString();
  const { amount } = store.checkoutConfiguration;
  const { orderAmount } = store.partialPaymentsOrderObj;

  const isPartialPaymentExpired = store.addedGiftCards.some(
    (cart) => now > cart.expiresAt,
  );
  const cartModified = isCartModified(amount, orderAmount);

  if (isPartialPaymentExpired) {
    removeGiftCards();
  } else if (cartModified) {
    removeGiftCards();
    showGiftCardWarningMessage();
  } else {
    clearGiftCardsContainer();
    store.addedGiftCards.forEach((card) => {
      renderAddedGiftCard(card);
    });
    if (store.addedGiftCards?.length) {
      showGiftCardInfoMessage();
    }
    store.checkout.options.amount =
      store.addedGiftCards[store.addedGiftCards.length - 1].remainingAmount;
    showGiftCardCancelButton(true);
    attachGiftCardCancelListener();
    createElementsToShowRemainingGiftCardAmount();
  }
}

function renderStoredPaymentMethod(imagePath) {
  return (pm) => {
    if (pm.supportedShopperInteractions.includes('Ecommerce')) {
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

function renderPosTerminals(adyenConnectedTerminals) {
  const removeChilds = () => {
    const posTerminals = document.querySelector('#adyenPosTerminals');
    while (posTerminals.firstChild) {
      posTerminals.removeChild(posTerminals.firstChild);
    }
  };
  if (adyenConnectedTerminals) {
    removeChilds();
    addPosTerminals(adyenConnectedTerminals);
  }
}

async function addStores(stores) {
  const storeDropdown = document.createElement('select');
  storeDropdown.id = 'storeList';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.text = 'Select a store';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  storeDropdown.appendChild(placeholderOption);

  const storeArray = typeof stores === 'string' ? stores.split(',') : stores;

  storeArray.forEach((terminalStore) => {
    const option = document.createElement('option');
    option.value = terminalStore.trim();
    option.text = terminalStore.trim();
    storeDropdown.appendChild(option);
  });
  const storeDropdownContainer = document.querySelector('#adyenPosStores');
  const existingDropdown = storeDropdownContainer.querySelector('#storeList');
  if (existingDropdown) {
    storeDropdownContainer.removeChild(existingDropdown);
  }
  storeDropdownContainer.append(storeDropdown);
  storeDropdown.addEventListener('change', async () => {
    const terminalDropdownContainer =
      document.querySelector('#adyenPosTerminals');
    const existingTerminalDropdown =
      terminalDropdownContainer.querySelector('#terminalList');
    if (existingTerminalDropdown) {
      terminalDropdownContainer.removeChild(existingTerminalDropdown); // Clear old terminal list
    }
    const data = await getConnectedTerminals();
    const parsedResponse = JSON.parse(data.response);
    const { uniqueTerminalIds } = parsedResponse;
    if (uniqueTerminalIds) {
      renderPosTerminals(uniqueTerminalIds);
      document.querySelector('button[value="submit-payment"]').disabled = false;
    }
  });
}

function setAmazonPayConfig(adyenPaymentMethods) {
  const amazonpay = adyenPaymentMethods.paymentMethods.find(
    (paymentMethod) => paymentMethod.type === 'amazonpay',
  );
  if (amazonpay) {
    store.checkoutConfiguration.paymentMethodsConfiguration.amazonpay.configuration =
      amazonpay.configuration;
    store.checkoutConfiguration.paymentMethodsConfiguration.amazonpay.addressDetails =
      {
        name: `${document.querySelector('#shippingFirstNamedefault')?.value} ${
          document.querySelector('#shippingLastNamedefault')?.value
        }`,
        addressLine1: document.querySelector('#shippingAddressOnedefault')
          ?.value,
        city: document.querySelector('#shippingAddressCitydefault')?.value,
        stateOrRegion: document.querySelector('#shippingAddressCitydefault')
          ?.value,
        postalCode: document.querySelector('#shippingZipCodedefault')?.value,
        countryCode: document.querySelector('#shippingCountrydefault')?.value,
        phoneNumber: document.querySelector('#shippingPhoneNumberdefault')
          ?.value,
      };
  }
}

function setInstallments(amount) {
  try {
    if (installmentLocales.indexOf(window.Configuration.locale) < 0) {
      return;
    }
    const installments = JSON.parse(
      window.installments.replace(/&quot;/g, '"'),
    );
    if (installments.length) {
      store.checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions =
        {};
    }
    installments.forEach((installment) => {
      const [minAmount, numOfInstallments, cards] = installment;
      if (minAmount <= amount.value) {
        cards.forEach((cardType) => {
          const { installmentOptions } =
            store.checkoutConfiguration.paymentMethodsConfiguration.card;
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
    store.checkoutConfiguration.paymentMethodsConfiguration.card.showInstallmentAmounts = true;
  } catch (e) {} // eslint-disable-line no-empty
}

function setGiftCardContainerVisibility() {
  const availableGiftCards = giftCardBrands();
  if (availableGiftCards.length === 0) {
    const giftCardContainer = document.querySelector('.gift-card-selection');
    giftCardContainer.style.display = 'none';
    const giftCardSeparator = document.querySelector('.gift-card-separator');
    giftCardSeparator.style.display = 'none';
  }
}

export async function initializeCheckout() {
  const paymentMethodsResponse = await getPaymentMethods();
  const giftCardsData = await fetchGiftCards();
  setCheckoutConfiguration(paymentMethodsResponse);

  store.checkoutConfiguration.paymentMethodsResponse = {
    ...paymentMethodsResponse.AdyenPaymentMethods,
    imagePath: paymentMethodsResponse.imagePath,
  };
  store.checkout = await AdyenCheckout(store.checkoutConfiguration);
  setGiftCardContainerVisibility();
  const { totalDiscountedAmount, giftCards } = giftCardsData;
  if (giftCards?.length) {
    store.addedGiftCards = giftCards;
    const lastGiftCard = store.addedGiftCards[store.addedGiftCards.length - 1];
    store.partialPaymentsOrderObj = { ...lastGiftCard, totalDiscountedAmount };
  }

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

  renderGiftCardLogo(paymentMethodsResponse.imagePath);

  const firstPaymentMethod = document.querySelector(
    'input[type=radio][name=brandCode]',
  );
  if (firstPaymentMethod) {
    firstPaymentMethod.checked = true;
    helpers.displaySelectedMethod(firstPaymentMethod.value);
  }

  if (window.activeTerminalApiStores) {
    addStores(window.activeTerminalApiStores);
  }

  helpers.createShowConfirmationForm(
    window.ShowConfirmationPaymentFromComponent,
  );
}

document.getElementById('email')?.addEventListener('change', (e) => {
  const emailPattern = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
  if (emailPattern.test(e.target.value)) {
    const { paymentMethodsConfiguration } = store.checkoutConfiguration;
    paymentMethodsConfiguration.card.clickToPayConfiguration.shopperEmail =
      e.target.value;
    const event = new Event(INIT_CHECKOUT_EVENT);
    document.dispatchEvent(event);
  }
});

// used by renderGiftCardComponent.js
document.addEventListener(INIT_CHECKOUT_EVENT, () => {
  const handleCheckoutEvent = async () => {
    if (Object.keys(store.componentsObj).length !== 0) {
      await unmountComponents();
    }

    await initializeCheckout();
  };

  handleCheckoutEvent();
});

/**
 * Calls getPaymentMethods and then renders the retrieved payment methods (including card component)
 */
async function renderGenericComponent() {
  if (Object.keys(store.componentsObj).length !== 0) {
    await unmountComponents();
  }

  await initializeCheckout();

  if (store.addedGiftCards?.length) {
    applyGiftCards();
  }

  attachGiftCardAddButtonListener();
}

module.exports = {
  renderGenericComponent,
  initializeCheckout,
  setInstallments,
  setAmazonPayConfig,
  renderStoredPaymentMethods,
  renderPaymentMethods,
  renderPosTerminals,
  isCartModified,
  resolveUnmount,
  renderGiftCardLogo,
  setGiftCardContainerVisibility,
  applyGiftCards,
  addStores,
  INIT_CHECKOUT_EVENT,
};
