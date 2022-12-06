require('./adyen-giving');
require('./amazon');
require('./summary');

var qrCodeMethods = ['swish', 'wechatpayQR', 'bcmc_mobile', 'pix'];
var installmentLocales = ['pt_BR', 'ja_JP', 'tr_TR', 'es_MX'];
var maskedCardNumber;
var MASKED_CC_PREFIX = '************';
var selectedMethod;
var componentsObj = {};
var checkoutConfiguration;
var sessionsResponse;
var paymentMethodsResponse;
var checkout;
var formErrorsExist;
var isValid;
var paypalTerminatedEarly = false;
/**
 * @function
 * @description Initializes Adyen Secured Fields  Billing events
 */
async function initializeBillingEvents() {
  $('#billing-submit').on('click', function () {
    var isAdyenPOS = document.querySelector('.payment-method-options :checked').value
        === 'AdyenPOS';
    var isAdyen = document.querySelector('.payment-method-options :checked').value === 'AdyenComponent';

    if (isAdyenPOS) {
      document.querySelector(
          '#dwfrm_adyPaydata_terminalId',
      ).value = document.querySelector('#terminalList').value;
      return true;
    }
    if (isAdyen) {
      var adyenPaymentMethod = document.querySelector(
          '#adyenPaymentMethodName',
      );
      var paymentMethodLabel = document.querySelector(`#lb_${selectedMethod}`)
          .innerHTML;
      adyenPaymentMethod.value = paymentMethodLabel;
      validateComponents();
      return showValidation();
    }
  });

  if (window.sessionsResponse) {
    sessionsResponse = window.sessionsResponse;
    checkoutConfiguration = window.Configuration;

    checkoutConfiguration.onChange = function (state /* , component */) {
      isValid = state.isValid;
      if (!componentsObj[selectedMethod]) {
        componentsObj[selectedMethod] = {};
      }
      componentsObj[selectedMethod].isValid = isValid;
      componentsObj[selectedMethod].stateData = state.data;
    };
    checkoutConfiguration.showPayButton = false;
    checkoutConfiguration.paymentMethodsConfiguration = {
      card: getCardConfig(),
      bcmc: getCardConfig(),
      storedCard: getCardConfig(),
      boletobancario: {
        personalDetailsRequired: true, // turn personalDetails section on/off
        billingAddressRequired: false, // turn billingAddress section on/off
        showEmailAddress: false, // allow shopper to specify their email address
      },
      paywithgoogle: getGooglePayConfig(),
      googlepay: getGooglePayConfig(),
      paypal: {
        environment: window.Configuration.environment,
        showPayButton: true,
        onClick: (data, actions) => {
          if(paypalTerminatedEarly) {
            paymentFromComponent({
              cancelTransaction: true,
              merchantReference: document.querySelector('#merchantReference').value,
            });
            paypalTerminatedEarly = false;
            return actions.resolve();
          }
          paypalTerminatedEarly = true;
          $('#dwfrm_billing').trigger('submit');
          if (formErrorsExist) {
            paypalTerminatedEarly = false;
            return actions.reject();
          }
        },
        onSubmit: (state, component) => {
          assignPaymentMethodValue();
          paymentFromComponent(state.data, component);
          document.querySelector('#adyenStateData').value = JSON.stringify(
              state.data,
          );
        },
        onCancel: (data, component) => {
          paypalTerminatedEarly = false;
          paymentFromComponent({
            cancelTransaction: true,
            merchantReference: document.querySelector('#merchantReference').value, }, component);
        },
        onError: (/* error, component */) => {
          paypalTerminatedEarly = false;
          $('#dwfrm_billing').trigger('submit');
        },
        onAdditionalDetails: (state /* , component */) => {
          paypalTerminatedEarly = false;
          document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(
              state.data,
          );
          $('#dwfrm_billing').trigger('submit');
        },
      },
      mbway: {
        showPayButton: true,
        onSubmit: (state, component) => {
          $('#dwfrm_billing').trigger('submit');
          assignPaymentMethodValue();
          if (formErrorsExist) {
            return false;
          }
          document.getElementById('component_mbway').querySelector('button').disabled = true;
          paymentFromComponent(state.data, component);
          document.querySelector('#adyenStateData').value = JSON.stringify(
              state.data,
          );
        },
        onError: (/* error, component */) => {
          $('#dwfrm_billing').trigger('submit');
        },
        onAdditionalDetails: (state /* , component */) => {
          document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(
              state.data,
          );
          $('#dwfrm_billing').trigger('submit');
        },
      },
      swish: getQRCodeConfig(),
      bcmc_mobile: getQRCodeConfig(),
      wechatpayQR: getQRCodeConfig(),
      pix: getQRCodeConfig(),
      amazonpay: getAmazonpayConfig(),
    };

    if (
        window.googleMerchantID !== 'null' &&
        window.Configuration.environment === 'live'
    ) {
      checkoutConfiguration.paymentMethodsConfiguration.paywithgoogle.configuration.merchantIdentifier =
        window.googleMerchantID;
      checkoutConfiguration.paymentMethodsConfiguration.googlepay.configuration.merchantIdentifier =
          window.googleMerchantID;
    }
    if(window.cardholderNameBool !== 'null') {
      checkoutConfiguration.paymentMethodsConfiguration.card.hasHolderName = true;
      checkoutConfiguration.paymentMethodsConfiguration.card.holderNameRequired = true;
    }
    checkoutConfiguration.session = {
      id: window.sessionsResponse.id,
      sessionData: window.sessionsResponse.sessionData,
    };
    checkout = await AdyenCheckout(checkoutConfiguration);
    paymentMethodsResponse = checkout.paymentMethodsResponse;

    document.querySelector('#paymentMethodsList').innerHTML = '';
    renderGenericComponent();
  }
}

function zeroAuth(data, checkout) {
  $.ajax({
    url: window.zeroAuthURL,
    type: 'POST',
    contentType: 'application/; charset=utf-8',
    data: JSON.stringify(data),
    async: false,
    success: function (data) {
      if(data.zeroAuthResult.action) {
        document.querySelector('#buttonsContainer').style.display = 'none';
        checkout.createFromAction(data.zeroAuthResult.action).mount('#newCard');
      }
      if(data.zeroAuthResult.resultCode === 'Authorised') {
        window.location.href = window.paymentInstrumentsList;
      } else if(data.zeroAuthResult.resultCode === 'Refused') {
        window.location.href = window.paymentInstrumentsListError;
      }
    },
  });
}

function paymentsDetails(state) {
  $.ajax({
    type: 'post',
    url: window.paymentsDetails,
    data: JSON.stringify({
      data: state.data
    }),
    contentType: 'application/; charset=utf-8',
    async: false,
    success(data) {
      if (data.response.isSuccessful) {
        window.location.href = window.paymentInstrumentsList;
      } else if (!data.response.isFinal && typeof data.response.action === 'object') {
        checkout.createFromAction(data.action).mount('#action-container');
      } else {
        window.location.href = window.paymentInstrumentsListError;
      }
    },
  });
}

/**
 * @function
 * @description Initializes Adyen Checkout My Account events
 */
async function initializeAccountEvents() {
  checkoutConfiguration = window.Configuration;
  checkoutConfiguration.onAdditionalDetails = function(state) {
    paymentsDetails(state);
  };
  checkoutConfiguration.session = window.sessionData;
  checkout = await AdyenCheckout(checkoutConfiguration);
  var newCard = document.getElementById('newCard');
  var adyenStateData;
  var isValid = false;
  var node = checkout
      .create('card', {
        hasHolderName: true,
        holderNameRequired: true,
        onChange: function (state) {
          adyenStateData = state.data;
          isValid = state.isValid;
        },
      })
      .mount(newCard);

  $('#applyBtn').on('click', function (e) {
    e.preventDefault();
    if (!isValid) {
      node.showValidation();
      return false;
    }
    document.querySelector('#adyenStateData').value = JSON.stringify(
        adyenStateData,
    );
    zeroAuth(adyenStateData, checkout);
  });
}

function assignPaymentMethodValue() {
  var adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
  adyenPaymentMethod.value = document.querySelector(
      `#lb_${selectedMethod}`,
  ).innerHTML;
}

/**
 * To avoid re-rendering components twice, unmounts existing components from payment methods list
 */
function unmountComponents() {
  var promises = Object.entries(componentsObj).map(function ([key, val]) {
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

function displaySelectedMethod(type) {
  selectedMethod = type;
  resetPaymentMethod();
  if (['paypal', 'paywithgoogle', 'googlepay', 'mbway', 'amazonpay', ...qrCodeMethods].indexOf(type) > -1) {
    document.querySelector('#billing-submit').disabled = true;
  } else {
    document.querySelector('#billing-submit').disabled = false;
  }
  document
      .querySelector(`#component_${type}`)
      .setAttribute('style', 'display:block');
}

function resetPaymentMethod() {
  $('.additionalFields').hide();
}

function showValidation() {
  if (componentsObj[selectedMethod] && !componentsObj[selectedMethod].isValid) {
    componentsObj[selectedMethod].node.showValidation();
    return false;
  }
  return true;
}

/**
 * Assigns stateData value to the hidden stateData input field
 * so it's sent to the backend for processing
 */
function validateComponents() {
  var stateData;
  if (
      componentsObj[selectedMethod] &&
      componentsObj[selectedMethod].stateData
  ) {
    stateData = componentsObj[selectedMethod].stateData;
  } else {
    var type = document.querySelector(`#component_${selectedMethod} .type`)
        ? document.querySelector(`#component_${selectedMethod} .type`).value
        : selectedMethod;

    stateData = {
      paymentMethod: {
        type: type
      }
    };
    var brandElm = document.querySelector(`#component_${selectedMethod} .brand`);
    if(brandElm && brandElm.value) {
      stateData.paymentMethod.brand = brandElm.value;
    }
  }

  document.querySelector('#adyenStateData').value = JSON.stringify(stateData);
}

/**
 * Contains fallback components for payment methods that don't have an Adyen web component yet
 */
function getFallback(paymentMethod) {
  var fallback = {
    giftcard: `
      <input type="hidden" class="brand" name="brand" value="${paymentMethod.brand}"/>
      <input type="hidden" class="type" name="type" value="${paymentMethod.type}"/>`,
  };
  return fallback[paymentMethod.type];
}

/**
 * Renders all payment methods (including card component) retrieved from Adyen session
 */
async function renderGenericComponent() {
  if (Object.keys(componentsObj).length) {
    await unmountComponents();
  }

  checkoutConfiguration.paymentMethodsResponse =
      paymentMethodsResponse.paymentMethods;
  if (sessionsResponse.amount) {
    checkoutConfiguration.amount = sessionsResponse.amount;
    checkoutConfiguration.paymentMethodsConfiguration.paypal.amount = sessionsResponse.amount;
    checkoutConfiguration.paymentMethodsConfiguration.amazonpay.amount =
        sessionsResponse.amount;
    setInstallments(sessionsResponse.amount);
  }
  if (sessionsResponse.countryCode) {
    checkoutConfiguration.countryCode = sessionsResponse.countryCode;
  }
  var amazonpay = paymentMethodsResponse.paymentMethods.find(
      (paymentMethod) => paymentMethod.type === 'amazonpay');
  if(amazonpay) {
    checkoutConfiguration.paymentMethodsConfiguration.amazonpay.configuration = amazonpay.configuration;
  }

  if (paymentMethodsResponse.storedPaymentMethods) {
    for (
        var i = 0;
        i < checkout.paymentMethodsResponse.storedPaymentMethods.length;
        i++
    ) {
      var paymentMethod = checkout.paymentMethodsResponse.storedPaymentMethods[i];
      if (paymentMethod.supportedShopperInteractions.includes('Ecommerce')) {
        renderPaymentMethod(
            paymentMethod,
            true,
            sessionsResponse.imagePath,
        );
      }
    }
  }

  paymentMethodsResponse.paymentMethods.forEach((pm) => {
    renderPaymentMethod(pm, false, sessionsResponse.imagePath);
  });

  var firstPaymentMethod = document.querySelector(
      'input[type=radio][name=brandCode]',
  );
  firstPaymentMethod.checked = true;
  displaySelectedMethod(firstPaymentMethod.value);
}

function getPaymentMethodID(isStored, paymentMethod) {
  if (isStored) {
    return `storedCard${paymentMethod.id}`;
  }
  if (paymentMethod.brand) {
    // gift cards all share the same type. Brand is used to differentiate between them
    return `${paymentMethod.type}_${paymentMethod.brand}`;
  }
  return paymentMethod.type;
}

function renderPaymentMethod(paymentMethod, storedPaymentMethodBool, path) {
  var paymentMethodsUI = document.querySelector('#paymentMethodsList');
  var li = document.createElement('li');
  var paymentMethodID = getPaymentMethodID(storedPaymentMethodBool, paymentMethod);
  var isSchemeNotStored =
      paymentMethod.type === 'scheme' && !storedPaymentMethodBool;
  var paymentMethodImage = storedPaymentMethodBool
      ? `${path}${paymentMethod.brand}.png`
      : `${path}${paymentMethod.type}.png`;
  var cardImage = `${path}card.png`;
  var imagePath = isSchemeNotStored ? cardImage : paymentMethodImage;
  var label = storedPaymentMethodBool
      ? `${paymentMethod.name} ${MASKED_CC_PREFIX}${paymentMethod.lastFour}`
      : `${paymentMethod.name}`;
  var liContents = `
                              <input name="brandCode" type="radio" value="${paymentMethodID}" id="rb_${paymentMethodID}">
                              <img class="paymentMethod_img" src="${imagePath}" ></img>
                              <label id="lb_${paymentMethodID}" for="rb_${paymentMethodID}" style="float: none; width: 100%; display: inline; text-align: inherit">${label}</label>
                             `;
  var container = document.createElement('div');

  li.innerHTML = liContents;
  li.classList.add('paymentMethod');

  var node = renderCheckoutComponent(
      storedPaymentMethodBool,
      checkout,
      paymentMethod,
      container,
      paymentMethodID,
  );

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

  var input = document.querySelector(`#rb_${paymentMethodID}`);
  input.onchange = async function (event) {
    if (
        document.querySelector('.adyen-checkout__qr-loader') &&
        qrCodeMethods.indexOf(selectedMethod) > -1 ||
        paypalTerminatedEarly
    ) {
      paypalTerminatedEarly = false;
      paymentFromComponent({
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
      });
    }

    displaySelectedMethod(event.target.value);
  };

  if (paymentMethodID === 'giropay') {
    container.innerHTML = '';
  }

  if (storedPaymentMethodBool && ['bcmc', 'scheme'].indexOf(paymentMethodID) > -1) {
    componentsObj[paymentMethodID].isValid = true;
  }
}

function renderCheckoutComponent(
    storedPaymentMethodBool,
    checkout,
    paymentMethod,
    container,
    paymentMethodID,
) {
  if (storedPaymentMethodBool) {
    return createCheckoutComponent(
        checkout,
        paymentMethod,
        container,
        paymentMethodID,
    );
  }
  var fallback = getFallback(paymentMethod);
  if (fallback) {
    var template = document.createElement('template');
    template.innerHTML = fallback;
    container.append(template.content);
    return;
  }
  return createCheckoutComponent(
      checkout,
      paymentMethod,
      container,
      paymentMethodID,
  );
}

function getPersonalDetails() {
  const shippingAddress = sessionsResponse.shippingAddress;
  return {
    firstName: shippingAddress.firstName,
    lastName: shippingAddress.lastName,
    telephoneNumber: shippingAddress.phone,
  };
}

function createCheckoutComponent(
    checkout,
    paymentMethod,
    container,
    paymentMethodID,
) {
  try {
    var nodeData = Object.assign(
        paymentMethod,
        {
          data: Object.assign(getPersonalDetails(),{personalDetails: getPersonalDetails()}),
          visibility: {
            personalDetails: 'editable',
            billingAddress: 'hidden',
            deliveryAddress: 'hidden',
          },
        });
    var node = checkout.create(paymentMethod.type, nodeData);
    if (!componentsObj[paymentMethodID]) {
      componentsObj[paymentMethodID] = {};
    }
    componentsObj[paymentMethodID].node = node;
    componentsObj[paymentMethodID].isValid = node.isValid;
    return node;
  } catch (e) {} // eslint-disable-line no-empty
  return false;
}

/**
 * Makes an ajax call to the controller function PaymentFromComponent.
 * Used by certain payment methods like paypal
 */
function paymentFromComponent(data, component) {
  $.ajax({
    url: window.paymentFromComponentURL,
    type: 'post',
    data: JSON.stringify(data),
    contentType: 'application/; charset=utf-8',
    success: function (data) {
      if (data.result && data.result.orderNo && data.result.orderToken) {
        document.querySelector('#orderToken').value = data.result.orderToken;
        document.querySelector('#merchantReference').value = data.result.orderNo;
      }
      if (
          data.result &&
          data.result.fullResponse &&
          data.result.fullResponse.action
      ) {
        component.handleAction(data.result.fullResponse.action);
      } else {
        document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(
            'null',
        );
        $('#dwfrm_billing').trigger('submit');
      }
    },
  }).fail(function (/* xhr, textStatus */) {});
}

$('#dwfrm_billing').submit(function (e) {
  if (
      ['paypal', 'mbway', 'amazonpay', ...qrCodeMethods].indexOf(selectedMethod) > -1 &&
      !document.querySelector('#paymentFromComponentStateData').value
  ) {
    e.preventDefault();
    var form = $(this);
    var url = form.attr('action');

    $.ajax({
      type: 'POST',
      url: url,
      data: form.serialize(),
      async: false,
      success: function (data) {
        formErrorsExist = data.fieldErrors;
      },
    });
  }
});

function getQRCodeConfig() {
  return {
    showPayButton: true,
    onSubmit: (state, component) => {
      $('#dwfrm_billing').trigger('submit');
      if (formErrorsExist) {
        return;
      }

      assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(
          state.data,
      );

      paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: (state /* , component */) => {
      document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(
          state.data,
      );
      $('#dwfrm_billing').trigger('submit');
    },
  };
}

function getCardConfig() {
  return {
    enableStoreDetails: showStoreDetails,
    showBrandsUnderCardNumber: false,
    onBrand: function (brandObject) {
      $('#cardType').val(brandObject.brand);
    },
    onFieldValid: function (data) {
      if (data.endDigits) {
        maskedCardNumber = MASKED_CC_PREFIX + data.endDigits;
        $('#cardNumber').val(maskedCardNumber);
      }
    },
    onChange: function (state) {
      isValid = state.isValid;
      var methodToUpdate = state.data.paymentMethod.storedPaymentMethodId ?
          `storedCard${state.data.paymentMethod.storedPaymentMethodId}` : selectedMethod;
      $('#browserInfo').val(JSON.stringify(state.data.browserInfo));
      componentsObj[methodToUpdate].isValid = isValid;
      componentsObj[methodToUpdate].stateData = state.data;
    },
  }
}

function getGooglePayConfig() {
  return {
    environment: window.Configuration.environment,
    onSubmit: () => {
      assignPaymentMethodValue();
      document.querySelector('#billing-submit').disabled = false;
      document.querySelector('#billing-submit').click();
    },
    configuration: {
      gatewayMerchantId: window.merchantAccount,
    },
    showPayButton: true,
    buttonColor: 'white',
  }
}

function getAmazonpayConfig() {
  return {
    showPayButton: true,
    productType: 'PayAndShip',
    checkoutMode: 'ProcessOrder',
    locale: window.Configuration.locale,
    returnUrl: window.returnURL,
    addressDetails: {
      name: sessionsResponse.shippingAddress.firstName
          + ' ' + sessionsResponse.shippingAddress.lastName,
      addressLine1: sessionsResponse.shippingAddress.address1,
      city:  sessionsResponse.shippingAddress.city,
      stateOrRegion: sessionsResponse.shippingAddress.city,
      postalCode:  sessionsResponse.shippingAddress.postalCode,
      countryCode: sessionsResponse.shippingAddress.country,
      phoneNumber: sessionsResponse.shippingAddress.phone,
    },
    onClick: (resolve, reject) => {
      $('#dwfrm_billing').trigger('submit');
      if (formErrorsExist) {
        reject();
      } else {
        assignPaymentMethodValue();
        resolve();
      }
    },
    onError: () => {},
  };
}

function getInstallmentValues(maxValue) {
  const values = [];
  for (let i = 1; i <= maxValue; i += 1) {
    values.push(i);
  }
  return values;
}

function setInstallments(amount) {
  try {
    if (installmentLocales.indexOf(window.Configuration.locale) < 0) {
      return;
    }
    const [minAmount, numOfInstallments] = window.installments ?
        window.installments.replace(/\[|]/g, '').split(',') : [null, null];
    if (minAmount <= amount.value) {
        checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions = {
        card: {},
      }; // eslint-disable-next-line max-len
        checkoutConfiguration.paymentMethodsConfiguration.card.installmentOptions.card.values = getInstallmentValues(
          numOfInstallments,
      );
        checkoutConfiguration.paymentMethodsConfiguration.card.showInstallmentAmounts = true;
    }
  } catch (e) {} // eslint-disable-line no-empty
}

/**
 * @function
 * @description Initializes Adyen CSE billing events
 */

exports.initBilling = function () {
  initializeBillingEvents();
};

exports.initAccount = function () {
  initializeAccountEvents();
};

exports.renderGenericComponent = function () {
  renderGenericComponent();
};
