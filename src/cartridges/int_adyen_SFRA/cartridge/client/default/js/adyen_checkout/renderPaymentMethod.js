const store = require('../../../../store');
const helpers = require('./helpers');
const { qrCodeMethods } = require('./qrCodeMethods');

function getFallback(paymentMethod) {
  const ach = `<div id="component_ach">
    <span class="adyen-checkout__label">Bank Account Owner Name</span>
    <input type="text" id="bankAccountOwnerNameValue" class="adyen-checkout__input">
    <span class="adyen-checkout__label">Bank Account Number</span>
    <input type="text" id="bankAccountNumberValue" class="adyen-checkout__input" maxlength="17" >
    <span class="adyen-checkout__label">Routing Number</span>
    <input type="text" id="bankLocationIdValue" class="adyen-checkout__input" maxlength="9" >
  </div>`;

  const ratepay = `<span class="adyen-checkout__label">Gender</span>
    <select id="genderInput" class="adyen-checkout__input">
        <option value="MALE">Male</option>
        <option value="FEMALE">Female</option>
    </select>
    <span class="adyen-checkout__label">Date of birth</span>
    <input id="dateOfBirthInput" class="adyen-checkout__input" type="date"/>
  `;

  const fallback = { ach, ratepay };
  return fallback[paymentMethod];
}

function setNode(paymentMethodID) {
  const createNode = (...args) => {
    if (!store.componentsObj[paymentMethodID]) {
      store.componentsObj[paymentMethodID] = {};
    }
    try {
      const node = store.checkout.create(...args);
      store.componentsObj[paymentMethodID].node = node;
    } catch (e) {
      /* No component for payment method */
    }
  };

  return createNode;
}

function getPaymentMethodID(isStored, paymentMethod) {
  return isStored ? `storedCard${paymentMethod.id}` : paymentMethod.type;
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
  const fallback = getFallback(paymentMethod.type);
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

function hasNoChildNodes({ paymentMethodID, container }) {
  return store.componentsObj[paymentMethodID] && !container.childNodes[0];
}

function setValid({ paymentMethodID, container }) {
  if (hasNoChildNodes({ paymentMethodID, container })) {
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
    if (
      document.querySelector('.adyen-checkout__qr-loader') &&
      qrCodeMethods.indexOf(store.selectedMethod) > -1
    ) {
      const compName = store.selectedMethod;
      const qrComponent = store.componentsObj[compName];

      await Promise.resolve(qrComponent.node.unmount(`component_${compName}`));
      delete store.componentsObj[compName];

      setNode(compName)(compName);
      const node = store.componentsObj[compName]?.node;
      if (node) {
        node.mount(document.querySelector(`#component_${compName}`));
      }

      helpers.paymentFromComponent({
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
      });
    }

    helpers.displaySelectedMethod(event.target.value);
  };
}

module.exports.renderPaymentMethod = function renderPaymentMethod(
  paymentMethod,
  isStored,
  path,
  description = null,
) {
  const paymentMethodsUI = document.querySelector('#paymentMethodsList');

  const li = document.createElement('li');
  const paymentMethodID = getPaymentMethodID(isStored, paymentMethod);
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
  const liContents = getListContents({ ...options, imagePath });

  li.innerHTML = liContents;
  li.classList.add('paymentMethod');

  handlePayment(options);
  configureContainer(options);

  li.append(container);
  paymentMethodsUI.append(li);

  const node = store.componentsObj[paymentMethodID]?.node;
  if (node) {
    node.mount(container);
  }

  if (paymentMethodID === 'giropay') {
    container.innerHTML = '';
  }

  handleInput(options);
  setValid(options);
};
