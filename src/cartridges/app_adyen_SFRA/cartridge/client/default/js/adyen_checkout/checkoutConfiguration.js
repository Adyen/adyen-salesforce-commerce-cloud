const store = require('../../../../store');
const helpers = require('./helpers');
const constants = require('../constants');

const { httpClient } = require('../commons/httpClient');
const CardConfig = require('./paymentMethodsConfiguration/card/cardConfig');
const StoredCardConfig = require('./paymentMethodsConfiguration/card/storedCardConfig');
const GooglePayConfig = require('./paymentMethodsConfiguration/googlePay/googlePayConfig');
const BoletoConfig = require('./paymentMethodsConfiguration/boleto/boletoConfig');
const KlarnaConfig = require('./paymentMethodsConfiguration/klarna/klarnaConfig');
const CashAppConfig = require('./paymentMethodsConfiguration/cashapp/cashappConfig');
const UpiConfig = require('./paymentMethodsConfiguration/upi/upiConfig');
const ApplePayConfig = require('./paymentMethodsConfiguration/applePay/applePayConfig');
const PayPalConfig = require('./paymentMethodsConfiguration/paypal/paypalConfig');
const AmazonPayConfig = require('./paymentMethodsConfiguration/amazonPay/amazonPayConfig');
const GiftCardConfig = require('./paymentMethodsConfiguration/giftcards/giftcardsConfig');

async function handleOnChange(state) {
  const { type } = state.data.paymentMethod;
  store.isValid = state.isValid;
  if (!store.componentsObj[type]) {
    store.componentsObj[type] = {};
  }
  store.componentsObj[type].isValid = store.isValid;
  store.componentsObj[type].stateData = state.data;
}

const actionHandler = async (action) => {
  const checkout = await AdyenCheckout(store.checkoutConfiguration);
  checkout.createFromAction(action).mount('#action-container');
  $('#action-modal').modal({ backdrop: 'static', keyboard: false });
  if (action.type === constants.ACTIONTYPE.QRCODE) {
    document
      .getElementById('cancelQrMethodsButton')
      .classList.remove('invisible');
  }
};

async function handleOnAdditionalDetails(state) {
  const requestData = JSON.stringify({
    data: state.data,
    orderToken: window.orderToken,
  });
  const data = await httpClient({
    method: 'POST',
    url: window.paymentsDetailsURL,
    data: {
      csrf_token: $('#adyen-token').val(),
      data: requestData,
    },
  });
  if (!data.isFinal && typeof data.action === 'object') {
    await actionHandler(data.action);
  } else {
    window.location.href = data.redirectUrl;
  }
}

function setCheckoutConfiguration() {
  store.checkoutConfiguration.onChange = handleOnChange;
  store.checkoutConfiguration.onAdditionalDetails = handleOnAdditionalDetails;
  store.checkoutConfiguration.showPayButton = false;
  store.checkoutConfiguration.clientKey = window.adyenClientKey;

  const cardConfig = new CardConfig(store, helpers).getConfig();
  const storedCardConfig = new StoredCardConfig(store, helpers).getConfig();
  const boletoConfig = new BoletoConfig().getConfig();
  const googlePayConfig = new GooglePayConfig(helpers).getConfig();
  const klarnaConfig = new KlarnaConfig(helpers).getConfig();
  const cashAppConfig = new CashAppConfig(helpers).getConfig();
  const upiConfig = new UpiConfig(helpers).getConfig();
  const applePayConfig = new ApplePayConfig(helpers).getConfig();
  const payPalConfig = new PayPalConfig(store, helpers).getConfig();
  const amazonPayConfig = new AmazonPayConfig(store, helpers).getConfig();
  const giftCardConfig = new GiftCardConfig(store, helpers).getConfig();

  store.checkoutConfiguration.paymentMethodsConfiguration = {
    card: cardConfig,
    bcmc: cardConfig,
    storedCard: storedCardConfig,
    boletobancario: boletoConfig,
    paywithgoogle: googlePayConfig,
    googlepay: googlePayConfig,
    paypal: payPalConfig,
    amazonpay: amazonPayConfig,
    giftcard: giftCardConfig,
    applepay: applePayConfig,
    klarna: klarnaConfig,
    klarna_account: klarnaConfig,
    klarna_paynow: klarnaConfig,
    cashapp: cashAppConfig,
    upi: upiConfig,
  };
}

module.exports = {
  setCheckoutConfiguration,
  actionHandler,
};
