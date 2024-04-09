/* eslint-disable global-require */
let req;
let savePaymentInformation;
let currentBasket;
let billingData;
const {
  savePaymentInstrumentToWallet,
} = require('*/cartridge/scripts/checkout/checkoutHelpers');

beforeEach(() => {
  savePaymentInformation = require('../savePaymentInformation');
  jest.clearAllMocks();
  req = {
    currentCustomer: {
      raw: {
        authenticated: true,
        registered: true,
      },
      profile: {
        customerNo: 'mockedNo',
      },
      wallet: {
        paymentInstruments: [],
      },
    },
  };
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  billingData = {
    paymentMethod: {
      value: 'CREDIT_CARD',
    },
    saveCard: true,
    storedPaymentUUID: false,
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('savePaymentInformation', () => {
  it('should call savePaymentInstrumentsToWallet when all conditions are met', () => {
    savePaymentInformation(req, currentBasket, billingData);
    expect(savePaymentInstrumentToWallet).toBeCalledTimes(1);
  });

  it('should not call savePaymentInstrumentsToWallet when some conditions are not met ', () => {
    savePaymentInformation(req, currentBasket, billingData);
    req.currentCustomer.raw.registered = false;
    expect(savePaymentInstrumentToWallet).toBeCalledTimes(0);
  });
});
