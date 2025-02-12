const store = require('../../../../store');
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
const {
  getGiftCardConfig,
} = require('./paymentMethodsConfiguration/giftcards/giftcardsConfig');

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

  const cardConfig = new CardConfig().getConfig();
  const storedCardConfig = new StoredCardConfig().getConfig();
  const boletoConfig = new BoletoConfig().getConfig();
  const googlePayConfig = new GooglePayConfig().getConfig();
  const klarnaConfig = new KlarnaConfig().getConfig();
  const cashAppConfig = new CashAppConfig().getConfig();
  const upiConfig = new UpiConfig().getConfig();
  const applePayConfig = new ApplePayConfig().getConfig();
  const payPalConfig = new PayPalConfig().getConfig();
  const amazonPayConfig = new AmazonPayConfig().getConfig();

  store.checkoutConfiguration.paymentMethodsConfiguration = {
    card: cardConfig,
    bcmc: cardConfig,
    storedCard: storedCardConfig,
    boletobancario: boletoConfig,
    paywithgoogle: googlePayConfig,
    googlepay: googlePayConfig,
    paypal: payPalConfig,
    amazonpay: amazonPayConfig,
    giftcard: getGiftCardConfig(),
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
