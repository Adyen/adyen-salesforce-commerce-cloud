// Adyen constants

module.exports = {
  METHOD_ADYEN: 'Adyen',
  METHOD_ADYEN_POS: 'AdyenPOS',
  METHOD_ADYEN_COMPONENT: 'AdyenComponent',
  RECEIVED: 'Received',
  NOTENOUGHBALANCE: 'NotEnoughBalance',
  SUCCESS: 'Success',
  GIFTCARD: 'giftcard',
  ACTIONTYPE: {
    QRCODE: 'qrCode',
  },
  DISABLED_SUBMIT_BUTTON_METHODS: [
    'paypal',
    'paywithgoogle',
    'googlepay',
    'amazonpay',
    'applepay',
    'cashapp',
  ],
  APPLE_DOMAIN_URL:
    '/.well-known/apple-developer-merchantid-domain-association',
};
