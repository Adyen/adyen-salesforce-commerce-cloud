// mocks for all cartridge paths containing asterisk (*) symbol

// cartridge/models mocks
jest.mock('*/cartridge/models/order', () => {
  return jest.fn();
}, {virtual: true});

jest.mock('*/cartridge/models/cart', () => {
  return jest.fn();
}, {virtual: true});

jest.mock('*/cartridge/scripts/checkout/shippingHelpers', () => {
  return jest.fn();
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/selectShippingMethods', () => {
  return jest.fn();
}, {virtual: true});

// cartridge/scripts mocks
jest.mock('*/cartridge/scripts/adyenCheckout', () => {
  return {
    doPaymentsDetailsCall: jest.fn((payload) => {
      let resultCode;
      if (payload.paymentData) {
        resultCode = payload.paymentData;
      } else if (payload.details?.MD) {
        resultCode = payload.details.MD === 'mocked_md' ? 'Authorised' : 'Not_Authorised';
      }
      return {resultCode};
    }),
    createPaymentRequest: jest.fn(() => ({
      resultCode: 'Authorised',
    })),
    doCreatePartialPaymentOrderCall: jest.fn(() => {
       return {remainingAmount: 'mocked_amount', orderData: 'mocked_data'};

     }),
  };
}, {virtual: true});

jest.mock('*/cartridge/scripts/adyenDeleteRecurringPayment', () => {
  return { deleteRecurringPayment: jest.fn(() => true) };
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/saveExpressShopperDetails', () => {
  return jest.fn();
}, {virtual: true});

jest.mock('*/cartridge/scripts/adyenSessions', () => {
  return {
    createSession: jest.fn( () => ({
      id: 'mock_id',
      sessionData: 'mock_session_data',
    }))
  }
}, {virtual: true});

jest.mock('*/cartridge/scripts/adyenGetPaymentMethods', () => {
  return {
    getMethods: jest.fn(() => ({
      paymentMethods: [{type: 'visa'}],
    }))
  };
}, {virtual: true});

jest.mock('*/cartridge/scripts/adyenGetPaymentMethods', () => {
  return {
    getMethods: jest.fn(() => ({
      paymentMethods: [{type: 'visa'}],
    }))
  };
}, {virtual: true});
jest.mock('*/cartridge/scripts/adyenTerminalApi', () => {
  return {
    getTerminals: jest.fn(() => ({
      response: JSON.stringify({ foo: 'bar' }),
    })),
    createTerminalPayment: jest.fn(() => ({
      response: 'mockedSuccessResponse'
    }))
  };
}, {virtual: true});

jest.mock('*/cartridge/scripts/adyenZeroAuth', () => {
  return {
    zeroAuthPayment: jest.fn(() => ({
      error: false,
      resultCode: 'Authorised',
    }))
  };
}, {virtual: true});

jest.mock('*/cartridge/scripts/checkNotificationAuth', () => {
  return { check: jest.fn(() => true) };
}, {virtual: true});

jest.mock('*/cartridge/scripts/handleNotify', () => {
  return {
    notify: jest.fn(() => ({ success: true }))
  };
}, {virtual: true});

jest.mock('*/cartridge/scripts/updateSavedCards', () => {
  return {
    updateSavedCards: jest.fn()
  };
}, {virtual: true});

// cartridge/scripts/checkout mocks
jest.mock('*/cartridge/scripts/checkout/adyenHelpers', () => {
  return {
    validatePayment: jest.fn(() => ({ error: false })),
    handlePayments: jest.fn(() => ({ error: false, action: {type: 'mockedAction'} })),
  };
}, {virtual: true});

jest.mock('*/cartridge/scripts/checkout/checkoutHelpers', () => {
  const { toArray } = require('./__mocks__/dw/order/OrderMgr');

  const paymentInstrument = () => [
    {
      custom: {
        adyenPaymentData: 'mocked_adyen_payment_data',
        adyenRedirectURL: 'https://some_mocked_url/signature',
        adyenMD: 'mocked_adyen_MD',
      },
    },
  ];

  const iterator = () => {
    return {
      val: paymentInstrument(),
      next() {
        const prev = this.val[0];
        this.val = null;
        return prev;
      },
      hasNext() {
        return !!this.val;
      },
    };
  }

  const getPaymentInstruments = jest.fn(() => ({
    iterator,
    toArray,
    0: toArray()[0],
  }))

  return {
    getPaymentInstruments,
    placeOrder: jest.fn((order) => order),
    sendConfirmationEmail: jest.fn(),
    createOrder: jest.fn(() => ({
      orderNo: 'mocked_orderNo',
      orderToken: 'mocked_orderToken',
      getPaymentInstruments,
      getCustomerEmail: jest.fn(() => true),
    })),
    calculatePaymentTransaction: jest.fn(() => ({ error: false })),
    validateCreditCard: jest.fn(() => ({
      creditCardErrors: 'mockedCreditCardErrors',
    })),
    savePaymentInstrumentToWallet: jest.fn(() => ({
      creditCardHolder: 'mockedCardHolder',
      maskedCreditCardNumber: 'mockedCardNumber',
      creditCardType: 'mockedCardType',
      creditCardExpirationMonth: 'mockedExpirationMonth',
      creditCardExpirationYear: 'mockedExpirationYear',
      UUID: 'mockedUUID',
      creditCardNumber: 'mockedCardNumber',
    })),
    validatePayment: jest.fn(() => ({ error: false })),
  };
}, {virtual: true});

// cartridge/scripts/helpers mocks
jest.mock('*/cartridge/scripts/helpers/accountHelpers', () => {
  return {sendAccountEditedEmail: jest.fn()};
}, {virtual: true});

jest.mock('*/cartridge/scripts/helpers/addressHelpers', () => {
  return {
    gatherShippingAddresses:jest.fn((order) => ([
      'mockedAddress1', 'mockedAddress2'
    ])),
    checkIfAddressStored: jest.fn(),
    saveAddress: jest.fn(),
    generateAddressName: jest.fn(),
  };
}, {virtual: true});

jest.mock('*/cartridge/scripts/helpers/basketValidationHelpers', () => {
  return {
    validateProducts: jest.fn(() => ({ error: false })),
  };
}, {virtual: true});

jest.mock('*/cartridge/scripts/helpers/basketCalculationHelpers', () => {
  return {calculateTotals:jest.fn()};
}, {virtual: true});

jest.mock('*/cartridge/scripts/helpers/hooks', () => {
  return jest.fn(() => ({ error: false }));
}, {virtual: true});

// cartridge/scripts/hooks mocks
jest.mock('*/cartridge/scripts/hooks/fraudDetection', () => { return {} }, {virtual: true})
jest.mock('*/cartridge/scripts/hooks/validateOrder', () => { return {}} , {virtual: true})
jest.mock('*/cartridge/scripts/hooks/postAuthorizationHandling', () => { return {}} , {virtual: true})
// cartridge/scripts/util mocks
jest.mock('*/cartridge/scripts/util/adyenHelper', () => ({
    savePaymentDetails: jest.fn(),
    getAdyenHash: jest.fn((str, str2) => `${str} __ ${str2}`),
    getLoadingContext: jest.fn(() => 'mocked_loading_context'),
    getCurrencyValueForApi: jest.fn(() => ({
      value: 1000,
      getValueOrNull: jest.fn(() => 1000),
    })),
    isAdyenGivingAvailable: jest.fn(() => true),
    isApplePay: jest.fn(() => true),
    getAdyenGivingConfig: jest.fn(() => true),
    isOpenInvoiceMethod: jest.fn(() => false),
    getDonationAmounts: jest.fn(() => [10, 20, 30]),
    getCardToken: jest.fn(() => 'mocked_token'),
    getSFCCCardType: jest.fn(() => 'mocked_cardType'),
    createAdyenCheckoutResponse: jest.fn(() => ({isFinal: true, isSuccessful: false})),
    getCustomer: jest.fn(() => {}),
    createSignature: jest.fn( () => 'mocked_signature'),
    getCheckoutEnvironment: jest.fn(() => 'test'),
    createAdyenRequestObject: jest.fn(() => ({
      paymentMethod: {
        type: "scheme"
      }
    })),
    createAddressObjects: jest.fn((_foo, _bar, input) => input),
    getApplicableShippingMethods : jest.fn(() => ['mocked_shippingMethods']),
    createShopperObject: jest.fn((input) => input.paymentRequest),
    executeCall: jest.fn(() => ({
      resultCode: "Authorised"
    })),
    add3DS2Data: jest.fn((request) => {
      return request
    }),
    getAdyenComponentType : jest.fn(() => {}),
    getOrderMainPaymentInstrumentType: jest.fn(() => {}),
    getPaymentInstrumentType: jest.fn((isCreditCard) => isCreditCard ? 'CREDIT_CARD' : 'AdyenComponent'),
  }), {virtual: true});

jest.mock('*/cartridge/scripts/util/adyenConfigs', () => {
  return {
    getAdyenEnvironment: jest.fn(() => 'TEST'),
    getCreditCardInstallments: jest.fn(() => true),
    getAdyenApplePayTokenisationEnabled: jest.fn(() => true),
    getAdyenClientKey: jest.fn(() => 'mocked_client_key'),
    getGoogleMerchantID: jest.fn(() => 'mocked_google_merchant_id'),
    getAdyenCardholderNameEnabled: jest.fn(() => true),
    getAdyenPayPalIntent: jest.fn(() => 'mocked_intent'),
    getAdyenMerchantAccount: jest.fn(() => 'mocked_merchant_account'),
    getAdyenGivingEnabled: jest.fn(() => true),
    getAdyenGivingCharityName: jest.fn(() => 'mocked_charity_name'),
    getAdyenGivingCharityWebsite: jest.fn(
        () => 'mocked_charity_website',
    ),
    getAdyenGivingCharityDescription: jest.fn(
        () => 'mocked_charity_description',
    ),
    getAdyenGivingBackgroundUrl: jest.fn(
        () => 'mocked_background_url',
    ),
    getAdyenGivingLogoUrl: jest.fn(() => 'mocked_logo_url'),
    getAdyenSFRA6Compatibility: jest.fn(() => false),
    getAdyenBasketFieldsEnabled: jest.fn(() => false),
    getAdyen3DS2Enabled: jest.fn(() => false),
    getAdyenLevel23DataEnabled: jest.fn(() => false),
    getAdyenSalePaymentMethods:jest.fn(() => []),

  };
}, {virtual: true});

jest.mock('*/cartridge/scripts/util/array', () => {
  return { find: jest.fn((array, callback) => array.find(callback))};
}, {virtual: true});

jest.mock('*/cartridge/scripts/util/collections', () => {
  return { forEach: (arr, cb) => arr.toArray().forEach(cb) };
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices', () => {
  return {
    processPayment: jest.fn(),
    isNotAdyen: jest.fn(() => false),
  };
}, {virtual: true});
