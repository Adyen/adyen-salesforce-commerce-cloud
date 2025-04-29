"use strict";

// Adyen constants

module.exports = {
  METHOD_ADYEN: 'Adyen',
  METHOD_ADYEN_POS: 'AdyenPOS',
  METHOD_ADYEN_COMPONENT: 'AdyenComponent',
  METHOD_CREDIT_CARD: 'CREDIT_CARD',
  PAYMENT_INSTRUMENT_ADYEN_CREDIT: 'ADYEN_CREDIT',
  PAYMENT_INSTRUMENT_ADYEN_POS: 'Adyen_POS',
  PAYMENT_INSTRUMENT_ADYEN_COMPONENT: 'Adyen_Component',
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
    SUCCESS: 'Success',
    AUTHORISATION: 'AUTHORISATION',
    FAILURE: 'Failure'
  },
  ACTIONTYPES: {
    VOUCHER: 'voucher',
    GIFTCARD: 'giftcard'
  },
  CHECKOUT_COMPONENT_IMAGE_URL_PATH: 'images/logos/medium/',
  PAYMENTMETHODS: {
    APPLEPAY: 'applepay',
    AMAZONPAY: 'amazonpay',
    PAYPAL: 'paypal',
    GOOGLEPAY: 'googlepay'
  },
  CAN_SKIP_SUMMARY_PAGE: ['applepay', 'cashapp', 'upi', 'googlepay'],
  OPEN_INVOICE_METHODS: ['afterpay', 'klarna', 'ratepay', 'facilypay', 'riverty', 'atome', 'zip', 'affirm', 'clearpay'],
  SERVICE: {
    PAYMENT: 'AdyenPayment',
    PAYMENTDETAILS: 'AdyenPaymentDetails',
    RECURRING_DISABLE: 'AdyenRecurringDisable',
    POSPAYMENT: 'AdyenPosPayment',
    CHECKOUTPAYMENTMETHODS: 'AdyenCheckoutPaymentMethods',
    CONNECTEDTERMINALS: 'AdyenConnectedTerminals',
    ADYENGIVING: 'AdyenGiving',
    CHECKBALANCE: 'AdyenCheckBalance',
    CANCELPARTIALPAYMENTORDER: 'AdyenCancelPartialPaymentOrder',
    PARTIALPAYMENTSORDER: 'AdyenPartialPaymentsOrder',
    PAYPALUPDATEORDER: 'AdyenPaypalUpdateOrder',
    GETSTORES: 'AdyenManagementApiGetStores'
  },
  CONTRACT: {
    ONECLICK: 'ONECLICK'
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
    IN: 'IN',
    APSE: 'APSE'
  },
  POS_REGIONS: {
    US: 'US',
    AU: 'AU',
    EU: 'EU',
    APSE: 'APSE'
  },
  SHOPPER_INTERACTIONS: {
    CONT_AUTH: 'ContAuth',
    ECOMMERCE: 'Ecommerce'
  },
  DONATION_RESULT: {
    COMPLETED: 'completed'
  },
  RECURRING_PROCESSING_MODEL: {
    CARD_ON_FILE: 'CardOnFile'
  },
  MAX_API_RETRIES: 3,
  GIFTCARD_EXPIRATION_MINUTES: 30,
  OMS_NAMESPACE: 'adyen_payment',
  NOTIFICATION_PAYLOAD_DATA_SEPARATOR: ':',
  CHECKOUT_ENVIRONMENT_TEST: 'test',
  CHECKOUT_ENVIRONMENT_LIVE_EU: 'live',
  CHECKOUT_ENVIRONMENT_LIVE_US: 'live-us',
  CHECKOUT_ENVIRONMENT_LIVE_AU: 'live-au',
  CHECKOUT_ENVIRONMENT_LIVE_IN: 'live-in',
  CHECKOUT_ENVIRONMENT_LIVE_APSE: 'live-apse',
  POS_ENVIRONMENT_TEST: 'test',
  POS_ENVIRONMENT_LIVE_EU: 'live',
  POS_ENVIRONMENT_LIVE_US: 'live-us',
  POS_ENVIRONMENT_LIVE_AU: 'live-au',
  POS_ENVIRONMENT_LIVE_APSE: 'live-apse',
  POS_REFERENCE_ID: 'SalesforceCommerceCloudPOS',
  POS_PROTOCOL_VERSION: '3.0',
  POS_MESSAGE_CLASS: {
    SERVICE: 'Service'
  },
  POS_MESSAGE_CATEGORY: {
    PAYMENT: 'Payment',
    ABORT: 'Abort'
  },
  POS_MESSAGE_TYPE: {
    REQUEST: 'Request'
  },
  POS_ABORT_REASON: {
    MERCHANT_ABORT: 'MerchantAbort'
  },
  MERCHANT_APPLICATION_NAME: 'adyen-salesforce-commerce-cloud',
  EXTERNAL_PLATFORM_NAME: 'SalesforceCommerceCloud',
  EXTERNAL_PLATFORM_VERSION: 'SFRA',
  APPLE_DOMAIN_URL: '/.well-known/apple-developer-merchantid-domain-association',
  CHECKOUT_COMPONENT_VERSION: '5.68.0',
  CHECKOUT_API_VERSION: 'v71',
  VERSION: '25.2.3'
};