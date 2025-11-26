const $ = require('jquery');
const { getExpressPaymentMethods } = require('../../commons');
const { Paypal, ApplePay, GooglePay } = require('../paymentMethods/index');
const {
  APPLE_PAY,
  GOOGLE_PAY,
  PAYPAL,
  PAY_WITH_GOOGLE,
} = require('../../../../../../config/constants');
const store = require('../../../../../../config/store');

function hasEventListener(eventName) {
  const events = $._data($('body')[0], 'events');
  return events && events[eventName];
}

function isOnShippingStage() {
  const checkoutMain = document.getElementById('checkout-main');
  const dataStage = checkoutMain?.getAttribute('data-checkout-stage');

  const urlParams = new URLSearchParams(window.location.search);
  const urlStage = urlParams.get('stage');
  const { hash } = window.location;

  const isCustomerStage =
    dataStage === 'customer' || urlStage === 'customer' || hash === '#customer';

  // Only show on customer stage
  return isCustomerStage;
}

function getPaymentMethodConfig(adyenPaymentMethods, paymentMethodType) {
  return adyenPaymentMethods?.paymentMethods.find(
    (pm) => paymentMethodType.indexOf(pm.type) > -1,
  )?.configuration;
}

function ensureExpressContainer() {
  let container = document.getElementById('express-container');
  if (container) return container;
  container = document.createElement('div');
  container.id = 'express-container';
  const target =
    document.querySelector('.single-shipping .shipping-method-list') ||
    document.querySelector('.single-shipping') ||
    document.querySelector('#checkout-main') ||
    document.body;
  target.prepend(container);
  return container;
}

function getExpressPaymentButtons(paymentMethodsResponse) {
  const { shippingExpressMethods } = paymentMethodsResponse || {};
  if (!shippingExpressMethods || !shippingExpressMethods.length) {
    return [];
  }
  return shippingExpressMethods.map((pm) => {
    const $container = document.createElement('div');
    $container.setAttribute('id', `${pm}-container`);
    $container.setAttribute('class', `expressComponent ${pm}`);
    $container.setAttribute('data-method', `${pm}`);
    $container.setAttribute('style', 'padding:0');
    return $container;
  });
}

async function renderGooglePayButtonListener(e, response) {
  const {
    paymentMethodsResponse: {
      AdyenPaymentMethods,
      applicationInfo,
      adyenTranslations,
    } = {},
    button,
  } = response;
  const googlePayConfig = getPaymentMethodConfig(AdyenPaymentMethods, [
    GOOGLE_PAY,
    PAY_WITH_GOOGLE,
  ]);
  if (!googlePayConfig) return;
  const googlePay = new GooglePay(
    googlePayConfig,
    applicationInfo,
    adyenTranslations,
    false,
  );
  const googlePayComponent = await googlePay.getComponent();
  googlePayComponent.mount(button);
}

async function renderApplePayButtonListener(e, response) {
  const {
    paymentMethodsResponse: {
      AdyenPaymentMethods,
      applicationInfo,
      adyenTranslations,
    } = {},
    button,
  } = response;
  const applePayConfig = getPaymentMethodConfig(AdyenPaymentMethods, APPLE_PAY);
  if (!applePayConfig) return;
  const applePay = new ApplePay(
    applePayConfig,
    applicationInfo,
    adyenTranslations,
    false,
  );
  const applePayComponent = await applePay.getComponent();
  applePayComponent.mount(button);
}

async function renderPayPalButtonListener(e, response) {
  const {
    paymentMethodsResponse: {
      AdyenPaymentMethods,
      applicationInfo,
      adyenTranslations,
    } = {},
    button,
  } = response;
  const paypalConfig = getPaymentMethodConfig(AdyenPaymentMethods, PAYPAL);
  if (!paypalConfig) return;
  const paypal = new Paypal(paypalConfig, applicationInfo, adyenTranslations);
  const paypalComponent = await paypal.getComponent();
  paypalComponent.mount(button);
}

async function renderExpressPaymentContainerListener(e, response) {
  const { paymentMethodsResponse } = response;
  const container = ensureExpressContainer();
  const expressPaymentButtons = getExpressPaymentButtons(
    paymentMethodsResponse,
  );
  if (expressPaymentButtons.length) {
    container.replaceChildren(...expressPaymentButtons);
    expressPaymentButtons.forEach((button) => {
      const expressType = button.getAttribute('data-method');
      $('body').trigger(`shipping:render${expressType}Button`, {
        paymentMethodsResponse,
        button,
      });
    });
  } else {
    // No buttons -> clear any previous and hide container
    container.replaceChildren();
  }
}

function handleExpressButtonVisibility() {
  const container = document.getElementById('express-container');
  if (!container) {
    return;
  }

  if (!isOnShippingStage()) {
    // Hide buttons when not on customer stage
    container.replaceChildren();
    container.style.display = 'none';
  } else {
    // Show and render buttons on customer stage
    container.style.display = 'block';
    $('body').trigger('shipping:renderExpressPaymentContainer', {
      paymentMethodsResponse: store.paymentMethodsResponse,
    });
  }
}

function registerRenderers(paymentMethodsResponse) {
  const events = [
    {
      name: `shipping:render${PAYPAL}Button`,
      handler: renderPayPalButtonListener,
    },
    {
      name: `shipping:render${APPLE_PAY}Button`,
      handler: renderApplePayButtonListener,
    },
    {
      name: `shipping:render${GOOGLE_PAY}Button`,
      handler: renderGooglePayButtonListener,
    },
    {
      name: 'shipping:renderExpressPaymentContainer',
      handler: renderExpressPaymentContainerListener,
    },
    {
      name: 'checkout:updateCheckoutView',
      handler: (e, data) => {
        $('body').trigger('shipping:renderExpressPaymentContainer', {
          paymentMethodsResponse:
            store.paymentMethodsResponse || paymentMethodsResponse,
          order: data?.order,
        });
      },
    },
  ];
  events.forEach(({ name, handler }) => {
    if (!hasEventListener(name)) {
      $('body').on(name, handler);
    }
  });

  const checkoutMain = document.getElementById('checkout-main');
  if (checkoutMain) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-checkout-stage'
        ) {
          handleExpressButtonVisibility();
        }
      });
    });

    observer.observe(checkoutMain, {
      attributes: true,
      attributeFilter: ['data-checkout-stage'],
    });

    handleExpressButtonVisibility();
  }

  $(window).on('hashchange', () => {
    handleExpressButtonVisibility();
  });
}

async function init() {
  const enabled = window.areExpressPaymentsEnabledOnShipping === 'true';
  if (!enabled) return;

  if (!window.getExpressPaymentMethodsURL) {
    return;
  }

  const paymentMethodsResponse = await getExpressPaymentMethods();
  store.paymentMethodsResponse = paymentMethodsResponse;

  registerRenderers(paymentMethodsResponse);

  $(document).ready(() => {
    $('body').trigger('shipping:renderExpressPaymentContainer', {
      paymentMethodsResponse,
    });
  });
}

module.exports = {
  init,
};
