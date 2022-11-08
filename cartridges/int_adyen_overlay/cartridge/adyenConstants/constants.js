"use strict";

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
    REFUSED: 'Refused'
  },
  ACTIONTYPES: {
    VOUCHER: 'voucher',
    GIFTCARD: 'giftcard'
  },
  CHECKOUT_COMPONENT_IMAGE_URL_PATH: 'images/logos/medium/',
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
    PARTIALPAYMENTSORDER: 'AdyenPartialPaymentsOrder'
  },
  MODE: {
    TEST: 'TEST',
    LIVE: 'LIVE'
  },
  ADYEN_LIVE_URL: 'https://live.adyen.com/',
  ADYEN_TEST_URL: 'https://test.adyen.com/',
  FRONTEND_REGIONS: {
    US: 'US',
    AU: 'AU',
    EU: 'EU',
    IN: 'IN'
  },
  MAX_API_RETRIES: 3,
  CHECKOUT_ENVIRONMENT_TEST: 'test',
  CHECKOUT_ENVIRONMENT_LIVE_EU: 'live',
  CHECKOUT_ENVIRONMENT_LIVE_US: 'live-us',
  CHECKOUT_ENVIRONMENT_LIVE_AU: 'live-au',
  CHECKOUT_ENVIRONMENT_LIVE_IN: 'live-in',
  CHECKOUT_COMPONENT_VERSION: '5.26.0',
  VERSION: '22.2.0'
};