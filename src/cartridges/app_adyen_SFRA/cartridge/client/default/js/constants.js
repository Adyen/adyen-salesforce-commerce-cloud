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
};
