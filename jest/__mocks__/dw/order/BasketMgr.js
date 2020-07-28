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
export const getCurrentBasket = jest.fn(() => ({
  getShipments,
  getTotalGrossPrice,
}));
