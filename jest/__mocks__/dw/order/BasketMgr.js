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
export const getPaymentInstruments = jest.fn(() => [
  {
    custom: {},
    paymentTransaction: { paymentProcessor: 'mocked_payment_processor' },
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
}));
