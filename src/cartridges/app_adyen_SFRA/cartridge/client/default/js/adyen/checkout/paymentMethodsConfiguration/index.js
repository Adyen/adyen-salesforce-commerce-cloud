const CardConfig = require('./card/cardConfig');
const StoredCardConfig = require('./card/storedCardConfig');
const BcmcConfig = require('./bcmc/bcmcConfig');
const BoletoConfig = require('./boleto/boletoConfig');
const GooglePayConfig = require('./googlePay/googlePayConfig');
const KlarnaConfig = require('./klarna/klarnaConfig');
const CashAppConfig = require('./cashapp/cashappConfig');
const UpiConfig = require('./upi/upiConfig');
const ApplePayConfig = require('./applePay/applePayConfig');
const AmazonPayConfig = require('./amazonPay/amazonPayConfig');
const PayPalConfig = require('./paypal/paypalConfig');
const GiftCardsConfig = require('./giftcards/giftcardsConfig');
const PayPalFastlaneConfig = require('./paypal/paypalFastlaneConfig');

const store = require('../../../../../../config/store');
const helpers = require('../helpers');
const { httpClient } = require('../../commons/httpClient');

function getPaymentMethodsConfiguration(email, amount, AdyenPaymentMethods) {
  const cardConfig = new CardConfig(store, helpers, email, amount).getConfig();
  const storedCardConfig = new StoredCardConfig(store, helpers).getConfig();
  const bcmcConfig = new BcmcConfig(store, helpers).getConfig();
  const boletoConfig = new BoletoConfig().getConfig();
  const googlePayConfig = new GooglePayConfig(helpers).getConfig();
  const klarnaConfig = new KlarnaConfig(
    helpers,
    window.klarnaWidgetEnabled,
  ).getConfig();
  const cashAppConfig = new CashAppConfig(helpers).getConfig();
  const upiConfig = new UpiConfig(helpers).getConfig();
  const applePayConfig = new ApplePayConfig(helpers).getConfig();
  const payPalConfig = new PayPalConfig(store, helpers).getConfig();
  const amazonPayConfig = new AmazonPayConfig(
    store,
    helpers,
    AdyenPaymentMethods,
  ).getConfig();
  const giftCardsConfig = new GiftCardsConfig(
    store,
    httpClient,
    helpers,
  ).getConfig();
  const payPalFastlaneConfig = new PayPalFastlaneConfig(
    store,
    helpers,
  ).getConfig();

  return {
    scheme: cardConfig,
    bcmc: bcmcConfig,
    storedCard: storedCardConfig,
    boletobancario: boletoConfig,
    paywithgoogle: googlePayConfig,
    googlepay: googlePayConfig,
    paypal: payPalConfig,
    amazonpay: amazonPayConfig,
    giftcard: giftCardsConfig,
    applepay: applePayConfig,
    klarna: klarnaConfig,
    klarna_account: klarnaConfig,
    klarna_paynow: klarnaConfig,
    cashapp: cashAppConfig,
    upi: upiConfig,
    fastlane: payPalFastlaneConfig,
  };
}

module.exports = getPaymentMethodsConfiguration;
