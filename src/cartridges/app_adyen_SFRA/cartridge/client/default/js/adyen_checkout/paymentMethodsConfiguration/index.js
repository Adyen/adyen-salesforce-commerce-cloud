const CardConfig = require('./card/cardConfig');
const StoredCardConfig = require('./card/storedCardConfig');
const BoletoConfig = require('./boleto/boletoConfig');
const GooglePayConfig = require('./googlePay/googlePayConfig');
const KlarnaConfig = require('./klarna/klarnaConfig');
const CashAppConfig = require('./cashapp/cashappConfig');
const UpiConfig = require('./upi/upiConfig');
const ApplePayConfig = require('./applePay/applePayConfig');
const AmazonPayConfig = require('./amazonPay/amazonPayConfig');
const PayPalConfig = require('./paypal/paypalConfig');
const GiftCardsConfig = require('./giftcards/giftcardsConfig');
const store = require('../../../../../store');
const helpers = require('../helpers');

const cardConfig = new CardConfig(store, helpers).getConfig();
const storedCardConfig = new StoredCardConfig(store, helpers).getConfig();
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
const amazonPayConfig = new AmazonPayConfig(store, helpers).getConfig();
const giftCardsConfig = new GiftCardsConfig(store, helpers).getConfig();

const paymentMethodsConfiguration = {
  card: cardConfig,
  bcmc: cardConfig,
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
};

module.exports = paymentMethodsConfiguration;
