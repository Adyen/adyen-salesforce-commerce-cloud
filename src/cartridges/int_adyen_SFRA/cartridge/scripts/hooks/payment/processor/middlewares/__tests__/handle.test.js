/* eslint-disable global-require */
let handle;
let paymentInformation;
let currentBasket;

beforeEach(() => {
  handle = require('../handle');
  jest.clearAllMocks();
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  paymentInformation = {
    isCreditCard: true,
    cardType: 'mockedType',
    cardNumber: 'mockedCardNumber',
    adyenPaymentMethod: 'Credit Card',
    adyenIssuerName: null,
    stateData: '{"paymentMethod": {"type":"scheme"}}',
    creditCardToken: 'mockedStoredCardToken',
    expirationMonth: { value: 'mockedMonth' },
    expirationYear: { value: 'mockedYear' },
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Handle', () => {
  it('should create payment instrument', () => {
    handle(currentBasket, paymentInformation);
    expect(currentBasket.createPaymentInstrument).toBeCalledTimes(1);
  });

  it('should set card details to payment instrument when payment method is credit card', () => {
    const { setCreditCardToken } = require('dw/order/BasketMgr');
    handle(currentBasket, paymentInformation);
    expect(setCreditCardToken).toBeCalledTimes(1);
  });
});
