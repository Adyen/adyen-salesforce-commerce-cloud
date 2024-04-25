const store = require('../../../../store');
const helpers = require('./helpers');
const constants = require('../constants');

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

function setNode(paymentMethodID) {
  const createNode = (...args) => {
    if (!store.componentsObj[paymentMethodID]) {
      store.componentsObj[paymentMethodID] = {};
    }
    try {
      // ALl nodes created for the checkout component are enriched with shopper personal details
      const node = store.checkout.create(...args, {
        data: {
          ...getPersonalDetails(),
          personalDetails: getPersonalDetails(),
        },
        visibility: {
          personalDetails: 'editable',
          billingAddress: 'hidden',
          deliveryAddress: 'hidden',
        },
      });
      store.componentsObj[paymentMethodID].node = node;
      store.componentsObj[paymentMethodID].isValid = node.isValid;
    } catch (e) {
      /* No component for payment method */
    }
  };

  return createNode;
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
  return fallback
    ? createTemplate()
    : setNode(paymentMethod.type)(paymentMethodID);
}

function handlePayment(options) {
  return options.isStored
    ? setNode(options.paymentMethodID)('card', options.paymentMethod)
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

function setValid({ isStored, paymentMethodID }) {
  if (isStored && ['bcmc', 'scheme'].indexOf(paymentMethodID) > -1) {
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
  input.onchange = async (event) => {
    helpers.displaySelectedMethod(event.target.value);
  };
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

async function checkIfNodeIsAvailable(node) {
  if (node.isAvailable) {
    const isNodeAvailable = await node.isAvailable();
    if (!isNodeAvailable) {
      return false;
    }
  }
  return true;
}

async function appendNodeToContainerIfAvailable(
  paymentMethodsUI,
  li,
  node,
  container,
) {
  if (node) {
    const canBeMounted = await checkIfNodeIsAvailable(node);
    if (canBeMounted) {
      paymentMethodsUI.append(li);
      node.mount(container);
    }
  }
}

module.exports.renderPaymentMethod = async function renderPaymentMethod(
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
      return;
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

    await appendNodeToContainerIfAvailable(
      paymentMethodsUI,
      li,
      store.componentsObj[paymentMethodID]?.node,
      container,
    );

    if (paymentMethodID === constants.GIROPAY) {
      container.innerHTML = '';
    }

    handleInput(options);
    setValid(options);
    canRender = true;
  } catch (err) {
    // method not available
    canRender = false;
  }
  // eslint-disable-next-line
  return canRender;
};
