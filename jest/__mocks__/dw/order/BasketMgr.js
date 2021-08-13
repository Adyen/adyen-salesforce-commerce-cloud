export const getCountryCode = jest.fn(() => ({ value: 'NL' }));
export const address = {
  setAddress1: jest.fn(),
  setAddress2: jest.fn(),
  setCity: jest.fn(),
  setCompanyName: jest.fn(),
  setCountryCode: jest.fn(),
  setFirstName: jest.fn(),
  setLastName: jest.fn(),
  setPhone: jest.fn(),
  setPostalCode: jest.fn(),
  setPostBox: jest.fn(),
  setSalutation: jest.fn(),
  setSecondName: jest.fn(),
  setStateCode: jest.fn(),
  setSuffix: jest.fn(),
  setSuite: jest.fn(),
  setTitle: jest.fn(),
};

export const getShipment = jest.fn(() => {
  return {
    createShippingAddress: jest.fn( () =>address),
  }
});

export const getShipments = jest.fn(() => [
  {
    shippingAddress: {
      getCountryCode,
    }
  },
]);

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
    paymentMethod: 'mocked_method',
  },
]);
export const getPaymentInstruments = jest.fn(() => ({ toArray }));
export const getDefaultShipment = jest.fn(() => ({
  shippingAddress: 'mocked_shipping_address',
}));
export const getBillingAddress = jest.fn(() => {
  return address
});
export const getCurrentBasket = jest.fn(() => ({
  getShipments,
  getShipment,
  getTotalGrossPrice,
  getPaymentInstruments,
  removePaymentInstrument: jest.fn(),
  createPaymentInstrument: jest.fn(() => toArray()[0]),
  defaultShipment: getDefaultShipment(),
  billingAddress: getBillingAddress(),
  createBillingAddress: getBillingAddress,
  setCustomerEmail: jest.fn(),
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
