/* eslint-disable global-require */
// mocks for all cartridge paths containing asterisk (*) symbol
// cartridge/models mocks
jest.mock('*/cartridge/models/order', () => jest.fn(), { virtual: true });

jest.mock('*/cartridge/models/cart', () => jest.fn(), { virtual: true });

jest.mock('*/cartridge/models/account', () => jest.fn(), { virtual: true });

jest.mock('*/cartridge/models/shipping/shippingMethod', () => jest.fn(), {
  virtual: true,
});

jest.mock(
  '*/cartridge/scripts/checkout/shippingHelpers',
  () => ({
    getShipmentByUUID: jest.fn(() => 'mocked_uuid'),
    selectShippingMethod: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/createTemporaryBasket',
  () => jest.fn(),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/selectShippingMethods',
  () => jest.fn(),
  { virtual: true },
);

// cartridge/scripts mocks
jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenCheckout',
  () => ({
    doPaymentsCall: jest.fn(() => ({
      pspReference: 'mocked_pspReference',
    })),
    doPaymentsDetailsCall: jest.fn((payload) => {
      let resultCode;
      if (payload.paymentData) {
        resultCode = payload.paymentData;
      } else if (payload.details?.MD) {
        resultCode =
          payload.details.MD === 'mocked_md' ? 'Authorised' : 'Not_Authorised';
      }
      return { resultCode, paymentMethod: { type: 'mocked_type' } };
    }),
    createPaymentRequest: jest.fn(() => ({
      resultCode: 'Authorised',
    })),
    doCreatePartialPaymentOrderCall: jest.fn(() => ({
      remainingAmount: 'mocked_amount',
      orderData: 'mocked_data',
    })),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenDeleteRecurringPayment',
  () => ({ deleteRecurringPayment: jest.fn(() => true) }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/saveExpressShopperDetails',
  () => jest.fn(),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods',
  () => ({
    getMethods: jest.fn(() => ({
      paymentMethods: [{ type: 'visa' }],
    })),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/pos/adyenTerminalApi',
  () => ({
    getTerminals: jest.fn(() => ({
      response: JSON.stringify({ foo: 'bar' }),
    })),
    createTerminalPayment: jest.fn(() => ({
      response: 'mockedSuccessResponse',
    })),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenZeroAuth',
  () => ({
    zeroAuthPayment: jest.fn(() => ({
      error: false,
      resultCode: 'Authorised',
    })),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/webhooks/checkNotificationAuth',
  () => ({
    check: jest.fn(() => true),
    validateHmacSignature: jest.fn(() => true),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/webhooks/handleNotify',
  () => ({
    notify: jest.fn(() => ({ success: true })),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/updateSavedCards',
  () => ({
    updateSavedCards: jest.fn(),
  }),
  { virtual: true },
);

// cartridge/scripts/checkout mocks
jest.mock(
  '*/cartridge/adyen/utils/authorizationHelper',
  () => ({
    validatePayment: jest.fn(() => ({ error: false })),
    handlePayments: jest.fn(() => ({
      error: false,
      action: { type: 'mockedAction' },
    })),
  }),
  { virtual: true },
);

// cartridge/scripts/checkout mocks
jest.mock(
  '*/cartridge/scripts/checkout/checkoutHelpers',
  () => {
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

    const iterator = () => ({
      val: paymentInstrument(),
      next() {
        const prev = this.val[0];
        this.val = null;
        return prev;
      },
      hasNext() {
        return !!this.val;
      },
    });

    const getPaymentInstruments = jest.fn(() => ({
      iterator,
      toArray,
      0: toArray()[0],
    }));

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
  },
  { virtual: true },
);

// cartridge/scripts/helpers mocks
jest.mock(
  '*/cartridge/scripts/helpers/accountHelpers',
  () => ({ sendAccountEditedEmail: jest.fn() }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/scripts/helpers/addressHelpers',
  () => ({
    gatherShippingAddresses: jest.fn(() => [
      'mockedAddress1',
      'mockedAddress2',
    ]),
    checkIfAddressStored: jest.fn(),
    saveAddress: jest.fn(),
    generateAddressName: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/scripts/helpers/basketValidationHelpers',
  () => ({
    validateProducts: jest.fn(() => ({ error: false })),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/scripts/helpers/basketCalculationHelpers',
  () => ({ calculateTotals: jest.fn() }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/scripts/helpers/hooks',
  () => jest.fn(() => ({ error: false })),
  { virtual: true },
);

// cartridge/scripts/hooks mocks
jest.mock('*/cartridge/scripts/hooks/fraudDetection', () => ({}), {
  virtual: true,
});
jest.mock('*/cartridge/scripts/hooks/validateOrder', () => ({}), {
  virtual: true,
});
jest.mock('*/cartridge/scripts/hooks/postAuthorizationHandling', () => ({}), {
  virtual: true,
});
// cartridge/adyen/util mocks
jest.mock('*/cartridge/adyen/utils/validatePaymentMethod', () => ({
  validatePaymentMethod: jest.fn(() => jest.fn(() => true)),
}));
jest.mock(
  '*/cartridge/adyen/utils/adyenHelper',
  () => ({
    savePaymentDetails: jest.fn(),
    getAdyenHash: jest.fn(() => 'mocked_hash'),
    getLoadingContext: jest.fn(() => 'mocked_loading_context'),
    getCurrencyValueForApi: jest.fn(() => ({
      value: 1000,
      getValueOrNull: jest.fn(() => 1000),
    })),
    isAdyenGivingAvailable: jest.fn(() => true),
    isApplePay: jest.fn(() => true),
    isPayPalExpress: jest.fn(() => false),
    getAdyenGivingConfig: jest.fn(() => true),
    getApplicationInfo: jest.fn(() => ({
      externalPlatform: { version: 'SFRA' },
    })),
    isOpenInvoiceMethod: jest.fn(() => false),
    getDonationAmounts: jest.fn(() => [10, 20, 30]),
    getCardToken: jest.fn(() => 'mocked_token'),
    getSFCCCardType: jest.fn(() => 'mocked_cardType'),
    getFirstTwoNumbersFromYear: jest.fn(() => 20),
    createAdyenCheckoutResponse: jest.fn(() => ({
      isFinal: true,
      isSuccessful: false,
    })),
    getCustomer: jest.fn(() => {}),
    createSignature: jest.fn(() => 'mocked_signature'),
    getCheckoutEnvironment: jest.fn(() => 'test'),
    createAdyenRequestObject: jest.fn(() => ({
      paymentMethod: {
        type: 'scheme',
      },
    })),
    createAddressObjects: jest.fn((_foo, _bar, input) => input),
    getApplicableShippingMethods: jest.fn(() => ['mocked_shippingMethods']),
    createShopperObject: jest.fn((input) => input.paymentRequest),
    executeCall: jest.fn(() => ({
      resultCode: 'Authorised',
    })),
    add3DS2Data: jest.fn((request) => request),
    getAdyenComponentType: jest.fn(() => {}),
    setPaymentTransactionType: jest.fn(() => {}),
    getOrderMainPaymentInstrumentType: jest.fn(() => {}),
    getPaymentInstrumentType: jest.fn((isCreditCard) =>
      (isCreditCard ? 'CREDIT_CARD' : 'AdyenComponent'),),
    validatePayment: jest.fn(() => ({ error: false })),
    handlePayments: jest.fn(() => ({
      error: false,
      action: { type: 'mockedAction' },
    })),
    createRedirectUrl: jest.fn(() => 'mocked_RedirectUrl'),
	getCustomerEmail: jest.fn(() => 'mocked_email'),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/adyenConfigs',
  () => ({
    getAdyenEnvironment: jest.fn(),
    getAdyenInstallmentsEnabled: jest.fn(() => true),
    getCreditCardInstallments: jest.fn(() => true),
    getAdyenTokenisationEnabled: jest.fn(() => true),
    getAdyenClientKey: jest.fn(() => 'mocked_client_key'),
    getGoogleMerchantID: jest.fn(() => 'mocked_google_merchant_id'),
    getAdyenCardholderNameEnabled: jest.fn(() => true),
    getAdyenPayPalIntent: jest.fn(() => 'mocked_intent'),
    getAdyenMerchantAccount: jest.fn(() => 'mocked_merchant_account'),
    getAdyenGivingEnabled: jest.fn(() => true),
    getAdyenGivingCharityName: jest.fn(() => '%mocked_charity_name%'),
    getAdyenGivingCharityWebsite: jest.fn(() => 'mocked_charity_website'),
    getAdyenGivingCharityDescription: jest.fn(
      () => '%mocked_charity_description%',
    ),
    getAdyenGivingBackgroundUrl: jest.fn(() => 'mocked_background_url'),
    getAdyenGivingLogoUrl: jest.fn(() => 'mocked_logo_url'),
    getAdyenSFRA6Compatibility: jest.fn(() => false),
    getAdyenHmacKey: jest.fn(() => 'mocked_hmacKey'),
    getAdyenBasketFieldsEnabled: jest.fn(() => false),
    getAdyen3DS2Enabled: jest.fn(() => false),
    getAdyenLevel23DataEnabled: jest.fn(() => false),
    getAdyenSalePaymentMethods: jest.fn(() => []),
    getAdyenPosRegion: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/client/default/js/adyen_checkout/renderGiftcardComponent',
  () => ({
    removeGiftCards: jest.fn(),
    showGiftCardWarningMessage: jest.fn(),
    clearGiftCardsContainer: jest.fn(),
    renderAddedGiftCard: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/scripts/util/array',
  () => ({ find: jest.fn((array, callback) => array.find(callback)) }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/scripts/util/collections',
  () => ({ forEach: (arr, cb) => arr.toArray().forEach(cb) }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices',
  () => ({
    processPayment: jest.fn(),
    isNotAdyen: jest.fn(() => false),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/lineItemHelper',
  () => ({
    getDescription: jest.fn((lineItem) => lineItem.productName),
    getId: jest.fn((lineItem) => lineItem.productID),
    getQuantity: jest.fn((lineItem) => lineItem.quantityValue),
    getItemAmount: jest.fn((lineItem) => ({
      divide: jest.fn((quantity) => ({
        getValue: jest.fn(() => lineItem.adjustedNetPrice / quantity),
      })),
    })),
    getVatAmount: jest.fn((lineItem) => ({
      divide: jest.fn((quantity) => ({
        getValue: jest.fn(() => lineItem.getAdjustedTax / quantity),
      })),
    })),
    getAllLineItems: jest.fn((lineItem) => lineItem),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/lineItemHelper',
  () => ({
    getDescription: jest.fn((lineItem) => lineItem.productName),
    getId: jest.fn((lineItem) => lineItem.productID),
    getQuantity: jest.fn((lineItem) => lineItem.quantityValue),
    getItemAmount: jest.fn((lineItem) => ({
      divide: jest.fn((quantity) => ({
        getValue: jest.fn(() => lineItem.adjustedNetPrice / quantity),
      })),
    })),
    getVatAmount: jest.fn((lineItem) => ({
      divide: jest.fn((quantity) => ({
        getValue: jest.fn(() => lineItem.getAdjustedTax / quantity),
      })),
    })),
    getAllLineItems: jest.fn((lineItem) => lineItem),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/paypalHelper',
  () => ({
    getLineItems: jest.fn(() => [
      {
        quantity: '1',
        description: 'test',
        itemCategory: 'PHYSICAL_GOODS',
        sku: '123',
        amountExcludingTax: '10000',
        taxAmount: '1000',
      },
    ]),
    createPaypalUpdateOrderRequest: jest.fn(() => ({
      pspReference: 'test',
      paymentData: 'test',
      amount: {
        value: '1000',
        currency: 'USD',
      },
      deliveryMethods: [
        {
          reference: '001',
          description: 'test',
          type: 'Shipping',
          amount: {
            currency: 'USD',
            value: '1000',
          },
          selected: true,
        },
      ],
    })),
    setBillingAndShippingAddress: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/client/default/js/adyen_checkout/helpers',
  () => ({
    setOrderFormData: jest.fn(),
    assignPaymentMethodValue: jest.fn(),
    paymentFromComponent: jest.fn(),
    resetPaymentMethod: jest.fn(),
    displaySelectedMethod: jest.fn(),
    showValidation: jest.fn(),
    createShowConfirmationForm: jest.fn(),
    getInstallmentValues: jest.fn(),
  }),
  { virtual: true },
);
