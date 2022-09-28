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
    VOUCHER: 'voucher'
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
    ADYENGIVING: 'AdyenGiving'
  },
  MODE: {
    TEST: 'TEST',
    LIVE: 'LIVE'
  },
  ADYEN_LIVE_URL: 'https://live.adyen.com/',
  ADYEN_TEST_URL: 'https://test.adyen.com/',
  FRONTEND_REGIONS: {
    EU: 'EU',
    US: 'US',
    AU: 'AU'
  },
  LOADING_CONTEXT_TEST: 'https://checkoutshopper-test.adyen.com/checkoutshopper/',
  LOADING_CONTEXT_LIVE_EU: 'https://checkoutshopper-live.adyen.com/checkoutshopper/',
  LOADING_CONTEXT_LIVE_US: 'https://checkoutshopper-live-us.adyen.com/checkoutshopper/',
  LOADING_CONTEXT_LIVE_AU: 'https://checkoutshopper-live-au.adyen.com/checkoutshopper/',
  CHECKOUT_COMPONENT_VERSION: '5.6.1',
  VERSION: '22.1.0'
};