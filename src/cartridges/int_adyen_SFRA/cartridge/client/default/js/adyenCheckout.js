// eslint-disable-next-line no-unused-vars
let maskedCardNumber;
const MASKED_CC_PREFIX = '************';
let selectedMethod;
const componentsObj = {};
const checkoutConfiguration = window.Configuration;
let formErrorsExist;
let isValid = false;
let checkout;
$('#dwfrm_billing').submit(function (e) {
  e.preventDefault();

  const form = $(this);
  const url = form.attr('action');

  $.ajax({
    type: 'POST',
    url: url,
    data: form.serialize(),
    async: false,
    success: function (data) {
      formErrorsExist = 'fieldErrors' in data;
    },
  });
});

checkoutConfiguration.onChange = function (state) {
  const type = state.data.paymentMethod.type;
  isValid = state.isValid;
  if (!componentsObj[type]) {
    componentsObj[type] = {};
  }
  componentsObj[type].isValid = isValid;
  componentsObj[type].stateData = state.data;
};
checkoutConfiguration.showPayButton = false;
checkoutConfiguration.paymentMethodsConfiguration = {
  card: {
    enableStoreDetails: showStoreDetails,
    onBrand: function (brandObject) {
      document.querySelector('#cardType').value = brandObject.brand;
    },
    onFieldValid: function (data) {
      if (data.endDigits) {
        maskedCardNumber = MASKED_CC_PREFIX + data.endDigits;
        document.querySelector('#cardNumber').value = maskedCardNumber;
      }
    },
    onChange: function (state) {
      isValid = state.isValid;
      const componentName = state.data.paymentMethod.storedPaymentMethodId
        ? `storedCard${state.data.paymentMethod.storedPaymentMethodId}`
        : state.data.paymentMethod.type;
      if (componentName === selectedMethod || selectedMethod === 'bcmc') {
        componentsObj[selectedMethod].isValid = isValid;
        componentsObj[selectedMethod].stateData = state.data;
      }
    },
  },
  boletobancario: {
    personalDetailsRequired: true, // turn personalDetails section on/off
    billingAddressRequired: false, // turn billingAddress section on/off
    showEmailAddress: false, // allow shopper to specify their email address

    // Optionally prefill some fields, here all fields are filled:
    data: {
      firstName: document.getElementById('shippingFirstNamedefault').value,
      lastName: document.getElementById('shippingLastNamedefault').value,
    },
  },
  paywithgoogle: {
    environment: window.Configuration.environment,
    onSubmit: () => {
      assignPaymentMethodValue();
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
    },
    configuration: {
      gatewayMerchantId: window.merchantAccount,
    },
    showPayButton: true,
    buttonColor: 'white',
  },
  paypal: {
    environment: window.Configuration.environment,
    intent: 'capture',
    onSubmit: (state, component) => {
      assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(
        componentsObj[selectedMethod].stateData,
      );
      paymentFromComponent(state.data, component);
    },
    onCancel: (data, component) => {
      paymentFromComponent({ cancelTransaction: true }, component);
    },
    onError: (error, component) => {
      if (component) {
        component.setStatus('ready');
      }
      document.querySelector('#showConfirmationForm').submit();
    },
    onAdditionalDetails: (state) => {
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#showConfirmationForm').submit();
    },
    onClick: (data, actions) => {
      $('#dwfrm_billing').trigger('submit');
      if (formErrorsExist) {
        return actions.reject();
      }
    },
  },
  mbway: {
    showPayButton: true,
    onSubmit: (state, component) => {
      $('#dwfrm_billing').trigger('submit');
      assignPaymentMethodValue();
      if (!formErrorsExist) {
        document.getElementById('component_mbway').querySelector('button').disabled = true;
        paymentFromComponent(state.data, component);
        document.querySelector('#adyenStateData').value = JSON.stringify(
          state.data,
        );
      }
    },
    onError: (/* error, component */) => {
      document.querySelector('#showConfirmationForm').submit();
    },
    onAdditionalDetails: (state /* , component */) => {
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#showConfirmationForm').submit();
    },
  },
  afterpay_default: {
    visibility: {
      personalDetails: 'editable',
      billingAddress: 'hidden',
      deliveryAddress: 'hidden',
    },
    data: {
      personalDetails: {
        firstName: document.querySelector('#shippingFirstNamedefault').value,
        lastName: document.querySelector('#shippingLastNamedefault').value,
        telephoneNumber: document.querySelector('#shippingPhoneNumberdefault')
          .value,
        shopperEmail: document.querySelector('#email').value,
      },
    },
  },
  facilypay_3x: {
    visibility: {
      personalDetails: 'editable',
      billingAddress: 'hidden',
      deliveryAddress: 'hidden',
    },
    data: {
      personalDetails: {
        firstName: document.querySelector('#shippingFirstNamedefault').value,
        lastName: document.querySelector('#shippingLastNamedefault').value,
        telephoneNumber: document.querySelector('#shippingPhoneNumberdefault')
          .value,
        shopperEmail: document.querySelector('#email').value,
      },
    },
  },
};
if (window.installments) {
  try {
    const installments = JSON.parse(window.installments);
    checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
  } catch (e) {} // eslint-disable-line no-empty
}
if (window.paypalMerchantID !== 'null') {
  checkoutConfiguration.paymentMethodsConfiguration.paypal.merchantId = window.paypalMerchantID;
}
if (window.googleMerchantID !== 'null' && window.Configuration.environment === 'live') {
  checkoutConfiguration.paymentMethodsConfiguration.paywithgoogle.configuration.merchantIdentifier = window.googleMerchantID;
}

/**
 * Changes the "display" attribute of the selected method from hidden to visible
 */
function displaySelectedMethod(type) {
  selectedMethod = type;
  resetPaymentMethod();
  if (['paypal', 'paywithgoogle', 'mbway'].indexOf(type) > -1) {
    document.querySelector('button[value="submit-payment"]').disabled = true;
  } else {
    document.querySelector('button[value="submit-payment"]').disabled = false;
  }
  document
    .querySelector(`#component_${type}`)
    .setAttribute('style', 'display:block');
}

/**
 * To avoid re-rendering components twice, unmounts existing components from payment methods list
 */
function unmountComponents() {
  const promises = Object.entries(componentsObj).map(function ([key, val]) {
    delete componentsObj[key];
    return resolveUnmount(key, val);
  });
  return Promise.all(promises);
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
 * checks if payment method is blocked and returns a boolean accordingly
 */
function isMethodTypeBlocked(methodType) {
  const blockedMethods = [
    'bcmc_mobile_QR',
    'applepay',
    'cup',
    'wechatpay',
    'wechatpay_pos',
    'wechatpaySdk',
    'wechatpayQr',
  ];
  return blockedMethods.includes(methodType);
}

/**
 * Calls getPaymenMethods and then renders the retrieved payment methods (including card component)
 */
async function renderGenericComponent() {
  if (Object.keys(componentsObj).length !== 0) {
    await unmountComponents();
  }
  getPaymentMethods(function (data) {
    let paymentMethod;
    let i;
    checkoutConfiguration.paymentMethodsResponse = data.AdyenPaymentMethods;
    if (data.amount) {
      checkoutConfiguration.amount = data.amount;
      checkoutConfiguration.paymentMethodsConfiguration.paypal.amount = data.amount;
    }
    if (data.countryCode) {
      checkoutConfiguration.countryCode = data.countryCode;
    }
    checkout = new AdyenCheckout(checkoutConfiguration);

    document.querySelector('#paymentMethodsList').innerHTML = '';

    if (data.AdyenPaymentMethods.storedPaymentMethods) {
      for (
        i = 0;
        i < checkout.paymentMethodsResponse.storedPaymentMethods.length;
        i++
      ) {
        paymentMethod = checkout.paymentMethodsResponse.storedPaymentMethods[i];
        if (paymentMethod.supportedShopperInteractions.includes('Ecommerce')) {
          renderPaymentMethod(paymentMethod, true, data.ImagePath);
        }
      }
    }

    data.AdyenPaymentMethods.paymentMethods.forEach((pm, i) => {
      !isMethodTypeBlocked(pm.type)
        && renderPaymentMethod(
          pm,
          false,
          data.ImagePath,
          data.AdyenDescriptions[i].description,
        );
    });

    if (
      data.AdyenConnectedTerminals
      && data.AdyenConnectedTerminals.uniqueTerminalIds
      && data.AdyenConnectedTerminals.uniqueTerminalIds.length > 0
    ) {
      const posTerminals = document.querySelector('#adyenPosTerminals');
      while (posTerminals.firstChild) {
        posTerminals.removeChild(posTerminals.firstChild);
      }
      addPosTerminals(data.AdyenConnectedTerminals.uniqueTerminalIds);
    }
    const firstPaymentMethod = document.querySelector(
      'input[type=radio][name=brandCode]',
    );
    firstPaymentMethod.checked = true;
    displaySelectedMethod(firstPaymentMethod.value);
  });
}

function renderPaymentMethod(
  paymentMethod,
  storedPaymentMethodBool,
  path,
  description = null,
) {
  let node;
  const paymentMethodsUI = document.querySelector('#paymentMethodsList');

  const li = document.createElement('li');
  const paymentMethodID = storedPaymentMethodBool
    ? `storedCard${paymentMethod.id}`
    : paymentMethod.type;
  const isSchemeNotStored = paymentMethod.type === 'scheme' && !storedPaymentMethodBool;
  const paymentMethodImage = storedPaymentMethodBool
    ? `${path}${paymentMethod.brand}.png`
    : `${path}${paymentMethod.type}.png`;
  const cardImage = `${path}card.png`;
  const imagePath = isSchemeNotStored ? cardImage : paymentMethodImage;
  const label = storedPaymentMethodBool
    ? `${paymentMethod.name} ${MASKED_CC_PREFIX}${paymentMethod.lastFour}`
    : `${paymentMethod.name}`;
  let liContents = `
                              <input name="brandCode" type="radio" value="${paymentMethodID}" id="rb_${paymentMethodID}">
                              <img class="paymentMethod_img" src="${imagePath}" ></img>
                              <label id="lb_${paymentMethodID}" for="rb_${paymentMethodID}">${label}</label>
                             `;
  if (description) {
    liContents += `<p>${description}</p>`;
  }
  const container = document.createElement('div');
  li.innerHTML = liContents;
  li.classList.add('paymentMethod');

  if (storedPaymentMethodBool) {
    node = checkout.create('card', paymentMethod);
    if (!componentsObj[paymentMethodID]) {
      componentsObj[paymentMethodID] = {};
    }
    componentsObj[paymentMethodID].node = node;
  } else {
    const fallback = getFallback(paymentMethod.type);
    if (fallback) {
      const template = document.createElement('template');
      template.innerHTML = fallback;
      container.append(template.content);
    } else {
      try {
        node = checkout.create(paymentMethod.type);
        if (!componentsObj[paymentMethodID]) {
          componentsObj[paymentMethodID] = {};
        }
        componentsObj[paymentMethodID].node = node;
      } catch (e) {} // eslint-disable-line no-empty
    }
  }
  container.classList.add('additionalFields');
  container.setAttribute('id', `component_${paymentMethodID}`);
  container.setAttribute('style', 'display:none');

  li.append(container);
  paymentMethodsUI.append(li);

  if (paymentMethod.type !== 'paywithgoogle') {
    node && node.mount(container);
  } else {
    node
      .isAvailable()
      .then(() => {
        node.mount(container);
      })
      .catch(() => {}); // eslint-disable-line no-empty
  }

  const input = document.querySelector(`#rb_${paymentMethodID}`);
  input.onchange = (event) => {
    displaySelectedMethod(event.target.value);
  };

  if (paymentMethodID === 'giropay') {
    container.innerHTML = '';
  }

  if (componentsObj[paymentMethodID] && !container.childNodes[0]) {
    componentsObj[paymentMethodID].isValid = true;
  }
}

// eslint-disable-next-line no-unused-vars
function addPosTerminals(terminals) {
  const terminalSelect = document.createElement('select');
  terminalSelect.id = 'terminalList';
  for (const t in terminals) {
    const option = document.createElement('option');
    option.value = terminals[t];
    option.text = terminals[t];
    terminalSelect.appendChild(option);
  }
  document.querySelector('#adyenPosTerminals').append(terminalSelect);
}

function resetPaymentMethod() {
  $('#requiredBrandCode').hide();
  $('#selectedIssuer').val('');
  $('#adyenIssuerName').val('');
  $('#dateOfBirth').val('');
  $('#telephoneNumber').val('');
  $('#gender').val('');
  $('#bankAccountOwnerName').val('');
  $('#bankAccountNumber').val('');
  $('#bankLocationId').val('');
  $('.additionalFields').hide();
}

/**
 * Makes an ajax call to the controller function GetPaymentMethods
 */
function getPaymentMethods(paymentMethods) {
  $.ajax({
    url: 'Adyen-GetPaymentMethods',
    type: 'get',
    success: function (data) {
      paymentMethods(data);
    },
  });
}

/**
 * Makes an ajax call to the controller function PaymentFromComponent. Used by certain payment methods like paypal
 */
function paymentFromComponent(data, component) {
  $.ajax({
    url: 'Adyen-PaymentFromComponent',
    type: 'post',
    data: {
      data: JSON.stringify(data),
      paymentMethod: document.querySelector('#adyenPaymentMethodName').value,
    },
    success: function (data) {
      if (data.orderNo) {
        document.querySelector('#merchantReference').value = data.orderNo;
      }
      if (data.orderToken) {
        document.querySelector('#orderToken').value = data.orderToken;
      }
      if (data.fullResponse && data.fullResponse.action) {
        component.handleAction(data.fullResponse.action);
      } else {
        document.querySelector('#showConfirmationForm').submit();
      }
    },
  }).fail(function () {});
}

// Submit the payment
$('button[value="submit-payment"]').on('click', function () {
  if (document.querySelector('#selectedPaymentOption').value === 'AdyenPOS') {
    document.querySelector('#terminalId').value = document.querySelector(
      '#terminalList',
    ).value;
    return true;
  }

  assignPaymentMethodValue();
  validateComponents();
  return showValidation();
});

function assignPaymentMethodValue() {
  const adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
  adyenPaymentMethod.value = document.querySelector(
    `#lb_${selectedMethod}`,
  ).innerHTML;
}

function showValidation() {
  let input;
  if (componentsObj[selectedMethod] && !componentsObj[selectedMethod].isValid) {
    componentsObj[selectedMethod].node.showValidation();
    return false;
  } if (selectedMethod === 'ach') {
    let inputs = document.querySelectorAll('#component_ach > input');
    inputs = Object.values(inputs).filter(function (input) {
      return !(input.value && input.value.length > 0);
    });
    for (input of inputs) {
      input.classList.add('adyen-checkout__input--error');
    }
    if (inputs.length > 0) {
      return false;
    }
    return true;
  } if (selectedMethod === 'ratepay') {
    input = document.querySelector('#dateOfBirthInput');
    if (!(input.value && input.value.length > 0)) {
      input.classList.add('adyen-checkout__input--error');
      return false;
    }
    return true;
  }
  return true;
}

function validateCustomInputField(input) {
  if (input.value === '') {
    input.classList.add('adyen-checkout__input--error');
  } else if (input.value.length > 0) {
    input.classList.remove('adyen-checkout__input--error');
  }
}

/**
 * Assigns stateData value to the hidden stateData input field so it's sent to the backend for processing
 */
function validateComponents() {
  if (document.querySelector('#component_ach')) {
    const inputs = document.querySelectorAll('#component_ach > input');
    for (const input of inputs) {
      input.onchange = function () {
        validateCustomInputField(this);
      };
    }
  }
  if (document.querySelector('#dateOfBirthInput')) {
    document.querySelector('#dateOfBirthInput').onchange = function () {
      validateCustomInputField(this);
    };
  }

  let stateData;
  if (
    componentsObj[selectedMethod]
    && componentsObj[selectedMethod].stateData
  ) {
    stateData = componentsObj[selectedMethod].stateData;
  } else {
    stateData = { paymentMethod: { type: selectedMethod } };
  }

  if (selectedMethod === 'ach') {
    const bankAccount = {
      ownerName: document.querySelector('#bankAccountOwnerNameValue').value,
      bankAccountNumber: document.querySelector('#bankAccountNumberValue')
        .value,
      bankLocationId: document.querySelector('#bankLocationIdValue').value,
    };
    stateData.paymentMethod = {
      ...stateData.paymentMethod,
      bankAccount: bankAccount,
    };
  } else if (selectedMethod === 'ratepay') {
    if (
      document.querySelector('#genderInput').value
      && document.querySelector('#dateOfBirthInput').value
    ) {
      stateData.shopperName = {
        gender: document.querySelector('#genderInput').value,
      };
      stateData.dateOfBirth = document.querySelector('#dateOfBirthInput').value;
    }
  }
  document.querySelector('#adyenStateData').value = JSON.stringify(stateData);
}

/**
 * Contains fallback components for payment methods that don't have an Adyen web component yet
 */
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
                    <input id="dateOfBirthInput" class="adyen-checkout__input" type="date"/>`;

  const fallback = { ach: ach, ratepay: ratepay };
  return fallback[paymentMethod];
}

module.exports = {
  methods: {
    renderGenericComponent: renderGenericComponent,
  },
};
