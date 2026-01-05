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

async function checkIfNodeIsAvailable(node) {
  if (typeof node.isAvailable === 'function') {
    try {
      const isNodeAvailable = await node.isAvailable();
      return isNodeAvailable;
    } catch (error) {
      return false;
    }
  }
  return true;
}

async function setNode(paymentMethod, paymentMethodID) {
  if (!store.componentsObj[paymentMethodID]) {
    store.componentsObj[paymentMethodID] = {};
  }
  const componentConfig = getComponentConfig(paymentMethodID, paymentMethod);
  const node = window.AdyenWeb.createComponent(
    paymentMethod.type,
    store.checkout,
    componentConfig,
  );
  const isAvailable = await checkIfNodeIsAvailable(node);
  store.componentsObj[paymentMethodID].node = node;
  store.componentsObj[paymentMethodID].isValid = node.isValid;
  store.componentsObj[paymentMethodID].isAvailable = isAvailable;
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

function getLabel(isStored, paymentMethod, paymentMethodTitle) {
  const title = paymentMethodTitle || paymentMethod.name;
  const label = isStored
    ? ` ${store.MASKED_CC_PREFIX}${paymentMethod.lastFour}`
    : '';
  return `${title}${label}`;
}

async function handleFallbackPayment({
  paymentMethod,
  container,
  paymentMethodID,
}) {
  const fallback = getFallback(paymentMethod);
  const createTemplate = () => {
    const template = document.createElement('template');
    template.innerHTML = fallback;
    container.append(template.content);
  };
  return fallback ? createTemplate() : setNode(paymentMethod, paymentMethodID);
}

async function handlePayment(options) {
  return options.isStored
    ? setNode(options.paymentMethod, options.paymentMethodID)
    : handleFallbackPayment(options);
}

function getListContents({
  imagePath,
  isStored,
  paymentMethod,
  paymentMethodTitle,
  description,
}) {
  const paymentMethodID = getPaymentMethodID(isStored, paymentMethod);
  const label = getLabel(isStored, paymentMethod, paymentMethodTitle);
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

function createListItem(paymentMethodID, liContents) {
  const li = document.createElement('li');
  li.innerHTML = liContents;
  li.classList.add('paymentMethod');
  return li;
}

function mountComponentIfAvailable(paymentMethodID, container, li) {
  const componentObj = store.componentsObj[paymentMethodID];
  const isAvailable = componentObj?.isAvailable;

  if (isAvailable !== false) {
    componentObj?.node?.mount(container);
    return true;
  }
  li.remove();
  delete store.componentsObj[paymentMethodID];
  return false;
}

/**
 * To avoid re-rendering components twice, unmounts existing components from payment methods list
 */
function clearPaymentMethodsContainer() {
  const paymentMethodContainer = document.querySelector('#paymentMethodsList');
  // unmount all components before clearing
  Object.keys(store.componentsObj).forEach((paymentMethodID) => {
    const component = store.componentsObj[paymentMethodID];
    if (component?.node) {
      try {
        component.node.unmount();
      } catch (unmountError) {
        //
      }
    }
  });
  paymentMethodContainer.innerHTML = '';
  store.clearPaymentMethod();
}

async function renderPaymentMethod(
  paymentMethod,
  isStored,
  path,
  description = null,
  paymentMethodTitle = null,
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
      paymentMethodTitle,
      isSchemeNotStored,
    };

    const imagePath = getImagePath(options);
    const liContents = getListContents({ ...options, imagePath });
    const li = createListItem(paymentMethodID, liContents);

    await handlePayment(options);
    configureContainer(options);

    li.append(container);

    paymentMethodsUI.append(li);

    mountComponentIfAvailable(paymentMethodID, container, li);

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
    adyenPaymentMethodTitles,
    locale,
  } = paymentMethodsResponse;
  clearPaymentMethodsContainer();

  const filteredPaymentMethods = paymentMethods.filter((pm) => {
    if (pm.type === constants.GIFTCARD) {
      return false;
    }
    return !(
      pm.type === constants.FASTLANE &&
      store.fastlane.authResult?.authenticationState !== 'succeeded'
    );
  });

  const renderStoredPaymentMethods = storedPaymentMethods.map((pm) =>
    renderPaymentMethod(
      pm,
      true,
      imagePath,
      adyenDescriptions?.[pm.type],
      adyenPaymentMethodTitles?.[locale]?.[pm.type],
    ),
  );
  const renderPaymentMethods = filteredPaymentMethods.map((pm) =>
    renderPaymentMethod(
      pm,
      false,
      imagePath,
      adyenDescriptions?.[pm.type],
      adyenPaymentMethodTitles?.[locale]?.[pm.type],
    ),
  );

  await Promise.all([...renderStoredPaymentMethods, ...renderPaymentMethods]);
}

module.exports = {
  renderCheckout,
  renderPaymentMethod,
};
