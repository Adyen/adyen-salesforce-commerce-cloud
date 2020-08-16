export const getCountryCode = jest.fn(() => ({ value: 'NL' }));
export const getShipments = jest.fn(() => [
  {
    shippingAddress: {
      getCountryCode,
    },
  },
]);
export const getTotalGrossPrice = jest.fn(() => ({
  currencyCode: 'EUR',
}));

export const getCreditCardToken = jest.fn(() => 'mockedCreditCardToken');
export const getPaymentMethod = jest.fn(() => 'mockedPaymentMethod');

export const setCreditCardNumber = jest.fn();
export const setCreditCardType = jest.fn();
export const setCreditCardExpirationMonth = jest.fn();
export const setCreditCardExpirationYear = jest.fn();
export const setCreditCardToken = jest.fn();

export const getPaymentInstruments = jest.fn(() => [
  {
    custom: {},
    paymentTransaction: { paymentProcessor: 'mocked_payment_processor' },
    setCreditCardNumber,
    setCreditCardType,
    setCreditCardExpirationMonth,
    setCreditCardExpirationYear,
    setCreditCardToken,
    paymentMethod: 'mocked_method',
  },
]);
export const getDefaultShipment = jest.fn(() => ({
  shippingAddress: 'mocked_shipping_address',
}));
export const getBillingAddress = jest.fn(() => 'mocked_billing_address');
export const getCurrentBasket = jest.fn(() => ({
  getShipments,
  getTotalGrossPrice,
  getPaymentInstruments,
  removePaymentInstrument: jest.fn(),
  createPaymentInstrument: jest.fn(() => getPaymentInstruments()[0]),
  defaultShipment: getDefaultShipment(),
  billingAddress: getBillingAddress(),
  totalGrossPrice: {value: 'mockedValue'},
  paymentInstruments: [{
    getPaymentMethod,
    getCreditCardToken,
  }]
}));
