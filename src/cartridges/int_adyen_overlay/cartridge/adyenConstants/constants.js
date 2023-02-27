// Adyen constants

module.exports = {
  METHOD_ADYEN: 'Adyen',
  METHOD_ADYEN_POS: 'AdyenPOS',
  METHOD_ADYEN_COMPONENT: 'AdyenComponent',
  METHOD_CREDIT_CARD: 'CREDIT_CARD',
  // Possible checkout result codes
  RESULTCODES: {
    AUTHORISED: 'Authorised',
    CANCELLED: 'Cancelled',
    CHALLENGESHOPPER: 'ChallengeShopper',
    ERROR: 'Error',
    IDENTIFYSHOPPER: 'IdentifyShopper',
    PENDING: 'Pending',
    PRESENTTOSHOPPER: 'PresentToShopper',
    RECEIVED: 'Received',
    REDIRECTSHOPPER: 'RedirectShopper',
    REFUSED: 'Refused',
  },
  ACTIONTYPES: {
    VOUCHER: 'voucher',
    GIFTCARD: 'giftcard',
  },
  CHECKOUT_COMPONENT_IMAGE_URL_PATH: 'images/logos/medium/',

  PAYMENTMETHODS: {
    APPLEPAY: 'applepay',
    AMAZONPAY: 'amazonpay',
  },

  SERVICE: {
    PAYMENT: 'AdyenPayment',
    PAYMENTDETAILS: 'AdyenPaymentDetails',
    RECURRING_DISABLE: 'AdyenRecurringDisable',
    SESSIONS: 'AdyenSessions',
    POSPAYMENT: 'AdyenPosPayment',
    CHECKOUTPAYMENTMETHODS: 'AdyenCheckoutPaymentMethods',
    CONNECTEDTERMINALS: 'AdyenConnectedTerminals',
    ADYENGIVING: 'AdyenGiving',
    CHECKBALANCE: 'AdyenCheckBalance',
    CANCELPARTIALPAYMENTORDER: 'AdyenCancelPartialPaymentOrder',
    PARTIALPAYMENTSORDER: 'AdyenPartialPaymentsOrder',
  },
  CONTRACT: {
    ONECLICK: 'ONECLICK',
  },
  MODE: {
    TEST: 'TEST',
    LIVE: 'LIVE',
  },

  ADYEN_LIVE_URL: 'https://live.adyen.com/',
  ADYEN_TEST_URL: 'https://test.adyen.com/',

  FRONTEND_REGIONS: {
    US: 'US',
    AU: 'AU',
    EU: 'EU',
    IN: 'IN',
  },

  MAX_API_RETRIES: 3,

  GIFTCARD_EXPIRATION_MINUTES: 30,
  OMS_NAMESPACE: 'adyen_payment',

  CHECKOUT_ENVIRONMENT_TEST: 'test',
  CHECKOUT_ENVIRONMENT_LIVE_EU: 'live',
  CHECKOUT_ENVIRONMENT_LIVE_US: 'live-us',
  CHECKOUT_ENVIRONMENT_LIVE_AU: 'live-au',
  CHECKOUT_ENVIRONMENT_LIVE_IN: 'live-in',

  CHECKOUT_COMPONENT_VERSION: '5.28.0',
  VERSION: '23.1.0',
};
