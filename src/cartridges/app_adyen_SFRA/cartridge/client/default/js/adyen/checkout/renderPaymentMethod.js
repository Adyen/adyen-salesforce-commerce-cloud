const store = require('../../../../../config/store');
const helpers = require('./helpers');
const constants = require('../../../../../config/constants');

function getFallback(paymentMethod) {
  const fallback = {};
  if (fallback[paymentMethod.type]) {
    store.componentsObj[paymentMethod.type] = {};
  }
  return fallback[paymentMethod.type];
}

function getPersonalDetails() {
  return {
    firstName: document.querySelector('#shippingFirstNamedefault')?.value,
    lastName: document.querySelector('#shippingLastNamedefault')?.value,
    telephoneNumber: document.querySelector('#shippingPhoneNumberdefault')
      ?.value,
    shopperEmail: document.querySelector('.customer-summary-email')
      ?.textContent,
  };
}

const getComponentConfig = (paymentMethodID, paymentMethod) => {
  const baseConfig = {
    data: {
      personalDetails: getPersonalDetails(),
    },
    visibility: {
      personalDetails: 'editable',
      billingAddress: 'hidden',
      deliveryAddress: 'hidden',
    },
  };

  const additionalConfig = paymentMethodID.includes('storedCard')
    ? { ...store.paymentMethodsConfiguration.storedCard, ...paymentMethod }
    : store.paymentMethodsConfiguration[paymentMethodID];

  return { ...baseConfig, ...additionalConfig };
};

function setNode(paymentMethod, paymentMethodID) {
  if (!store.componentsObj[paymentMethodID]) {
    store.componentsObj[paymentMethodID] = {};
  }
  const componentConfig = getComponentConfig(paymentMethodID, paymentMethod);
  const node = window.AdyenWeb.createComponent(
    paymentMethod.type,
    store.checkout,
    componentConfig,
  );
  store.componentsObj[paymentMethodID].node = node;
  store.componentsObj[paymentMethodID].isValid = node.isValid;
}

function getPaymentMethodID(isStored, paymentMethod) {
  if (isStored) {
    return `storedCard${paymentMethod.id}`;
  }
  if (paymentMethod.type === constants.GIFTCARD) {
    return constants.GIFTCARD;
  }
  if (paymentMethod.brand) {
    return `${paymentMethod.type}_${paymentMethod.brand}`;
  }
  return paymentMethod.type;
}

function getImage(isStored, paymentMethod) {
  return isStored ? paymentMethod.brand : paymentMethod.type;
}

function getLabel(isStored, paymentMethod) {
  const label = isStored
    ? ` ${store.MASKED_CC_PREFIX}${paymentMethod.lastFour}`
    : '';
  return `${paymentMethod.name}${label}`;
}

function handleFallbackPayment({ paymentMethod, container, paymentMethodID }) {
  const fallback = getFallback(paymentMethod);
  const createTemplate = () => {
    const template = document.createElement('template');
    template.innerHTML = fallback;
    container.append(template.content);
  };
  return fallback ? createTemplate() : setNode(paymentMethod, paymentMethodID);
}

function handlePayment(options) {
  return options.isStored
    ? setNode(options.paymentMethod, options.paymentMethodID)
    : handleFallbackPayment(options);
}

function getListContents({ imagePath, isStored, paymentMethod, description }) {
  const paymentMethodID = getPaymentMethodID(isStored, paymentMethod);
  const label = getLabel(isStored, paymentMethod);
  const liContents = `
    <input name="brandCode" type="radio" value="${paymentMethodID}" id="rb_${paymentMethodID}">
    <img class="paymentMethod_img" src="${imagePath}" ></img>
    <label id="lb_${paymentMethodID}" for="rb_${paymentMethodID}">${label}</label>
  `;
  return description ? `${liContents}<p>${description}</p>` : liContents;
}

function getImagePath({ isStored, paymentMethod, path, isSchemeNotStored }) {
  const paymentMethodImage = `${path}${getImage(isStored, paymentMethod)}.png`;
  const cardImage = `${path}card.png`;
  return isSchemeNotStored ? cardImage : paymentMethodImage;
}

function setValid({ isStored, paymentMethodID, paymentMethod }) {
  if (isStored && ['bcmc', 'scheme'].indexOf(paymentMethod.type) > -1) {
    store.componentsObj[paymentMethodID].isValid = true;
  }
}

function configureContainer({ paymentMethodID, container }) {
  container.classList.add('additionalFields');
  container.setAttribute('id', `component_${paymentMethodID}`);
  container.setAttribute('style', 'display:none');
}

function handleInput({ paymentMethodID }) {
  const input = document.querySelector(`#rb_${paymentMethodID}`);
  if (input) {
    input.onchange = async (event) => {
      helpers.displaySelectedMethod(event.target.value);
    };
  }
}

function createListItem(rerender, paymentMethodID, liContents) {
  let li;
  if (rerender) {
    li = document.querySelector(`#rb_${paymentMethodID}`).closest('li');
  } else {
    li = document.createElement('li');
    li.innerHTML = liContents;
    li.classList.add('paymentMethod');
  }
  return li;
}

/**
 * To avoid re-rendering components twice, unmounts existing components from payment methods list
 */
function clearPaymentMethodsContainer() {
  const paymentMethodContainer = document.querySelector('#paymentMethodsList');
  paymentMethodContainer.innerHTML = '';
  store.clearPaymentMethod();
}

function renderPaymentMethod(
  paymentMethod,
  isStored,
  path,
  description = null,
  rerender = false,
) {
  let canRender;
  try {
    const paymentMethodsUI = document.querySelector('#paymentMethodsList');
    const paymentMethodID = getPaymentMethodID(isStored, paymentMethod);
    if (paymentMethodID === constants.GIFTCARD) {
      return false;
    }

    const isSchemeNotStored = paymentMethod.type === 'scheme' && !isStored;
    const container = document.createElement('div');

    const options = {
      container,
      paymentMethod,
      isStored,
      path,
      description,
      paymentMethodID,
      isSchemeNotStored,
    };

    const imagePath = getImagePath(options);
    const liContents = getListContents({ ...options, imagePath, description });
    const li = createListItem(rerender, paymentMethodID, liContents);

    handlePayment(options);
    configureContainer(options);

    li.append(container);

    paymentMethodsUI.append(li);
    store.componentsObj[paymentMethodID]?.node?.mount(container);

    if (paymentMethodID === constants.GIROPAY) {
      container.innerHTML = '';
    }

    handleInput(options);
    setValid(options);

    canRender = true;
  } catch (err) {
    canRender = false;
  }
  return canRender;
}

/**
 * Renders the retrieved payment methods excluding gift cards (including card component)
 */
async function renderCheckout(paymentMethodsResponse) {
  const {
    AdyenPaymentMethods: { paymentMethods, storedPaymentMethods },
    imagePath,
    adyenDescriptions,
  } = paymentMethodsResponse;
  clearPaymentMethodsContainer();

  const paymentMethodsWithoutGiftCards = paymentMethods.filter(
    (pm) => pm.type !== constants.GIFTCARD,
  );

  const renderStoredPaymentMethods = storedPaymentMethods.map((pm) =>
    renderPaymentMethod(
      pm,
      true,
      imagePath,
      adyenDescriptions ? adyenDescriptions[pm.type] : null,
    ),
  );
  const renderPaymentMethodsWithoutGiftCards =
    paymentMethodsWithoutGiftCards.map((pm) =>
      renderPaymentMethod(
        pm,
        false,
        imagePath,
        adyenDescriptions ? adyenDescriptions[pm.type] : null,
      ),
    );

  await Promise.all([
    ...renderStoredPaymentMethods,
    ...renderPaymentMethodsWithoutGiftCards,
  ]);
}

module.exports = {
  renderCheckout,
  renderPaymentMethod,
};
