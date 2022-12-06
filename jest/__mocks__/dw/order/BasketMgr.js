export const getCountryCode = jest.fn(() => ({ value: 'NL' }));
export const getShipments = jest.fn(() => [
  {
    shippingAddress: {
      getCountryCode,
    },
  },
]);

export const getAllProductLineItems = jest.fn( () => [1])

export const isAvailable = jest.fn(() => true);
export const getTotalGrossPrice = jest.fn(() => ({
  currencyCode: 'EUR',
  isAvailable,
}));

export const getCreditCardToken = jest.fn(() => 'mockedCreditCardToken');
export const getPaymentMethod = jest.fn(() => 'mockedPaymentMethod');

export const setCreditCardNumber = jest.fn();
export const setCreditCardType = jest.fn();
export const setCreditCardExpirationMonth = jest.fn();
export const setCreditCardExpirationYear = jest.fn();
export const setCreditCardToken = jest.fn();

export const toArray = jest.fn(() => [
  {
    custom: {},
    paymentTransaction: { paymentProcessor: 'mocked_payment_processor' },
    setCreditCardNumber,
    setCreditCardType,
    setCreditCardExpirationMonth,
    setCreditCardExpirationYear,
    setCreditCardToken,
    paymentMethod: 'AdyenComponent',
  },
]);
export const getPaymentInstruments = jest.fn(() => ({ toArray }));
export const getDefaultShipment = jest.fn(() => ({
  shippingAddress: 'mocked_shipping_address',
}));
export const getBillingAddress = jest.fn(() => 'mocked_billing_address');
export const getCurrentBasket = jest.fn(() => ({
  getShipments,
  getAllProductLineItems,
  getTotalGrossPrice,
  getPaymentInstruments,
  removePaymentInstrument: jest.fn(),
  createPaymentInstrument: jest.fn(() => toArray()[0]),
  defaultShipment: getDefaultShipment(),
  billingAddress: getBillingAddress(),
  totalGrossPrice: { value: 'mockedValue' },
  paymentInstruments: {
    toArray: jest.fn(() => [
      {
        getPaymentMethod,
        getCreditCardToken,
      },
    ]),
  },
  toArray,
}));
