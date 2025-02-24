"use strict";

// Adyen constants

module.exports = {
  METHOD_ADYEN: 'Adyen',
  METHOD_ADYEN_POS: 'AdyenPOS',
  METHOD_ADYEN_COMPONENT: 'AdyenComponent',
  RECEIVED: 'Received',
  NOTENOUGHBALANCE: 'NotEnoughBalance',
  SUCCESS: 'Success',
  GIFTCARD: 'giftcard',
  SCHEME: 'scheme',
  GIROPAY: 'giropay',
  APPLE_PAY: 'applepay',
  PAYPAL: 'paypal',
  AMAZON_PAY: 'amazonpay',
  GOOGLE_PAY: 'googlepay',
  PAY_WITH_GOOGLE: 'paywithgoogle',
  GOOGLE_PAY_CALLBACK_TRIGGERS: {
    INITIALIZE: 'INITIALIZE',
    SHIPPING_ADDRESS: 'SHIPPING_ADDRESS',
    SHIPPING_OPTION: 'SHIPPING_OPTION'
  },
  ACTIONTYPE: {
    QRCODE: 'qrCode'
  },
  DISABLED_SUBMIT_BUTTON_METHODS: ['paypal', 'paywithgoogle', 'googlepay', 'amazonpay', 'applepay', 'cashapp', 'upi']
};