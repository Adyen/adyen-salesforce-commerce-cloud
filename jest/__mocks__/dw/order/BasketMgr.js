export const getCountryCode = jest.fn(() => ({ value: 'NL' }));
export const getShipments = jest.fn(() => [
  {
    shippingAddress: {
      getCountryCode,
    },
  },
]);

export const createBillingAddress = {
  setCountryCode: jest.fn(),
  setPostalCode: jest.fn(),
  setAddress1: jest.fn(),
  setAddress2: jest.fn(),
  setCountryCode: jest.fn(),
  setCity: jest.fn(),
  setFirstName: jest.fn(),
  setLastName: jest.fn(),
  setPhone: jest.fn(),
  setStateCode: jest.fn(),
};

export const setAddress1 = jest.fn();
export const setAddress2 = jest.fn();
export const setFirstName = jest.fn();
export const setLastName = jest.fn();
export const setCity = jest.fn();
export const setPhone = jest.fn();
export const setCountryCode = jest.fn();
export const setPostalCode = jest.fn();

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
  shippingAddress: {
                         setCountryCode: jest.fn(),
                         setPostalCode: jest.fn(),
                         setAddress1: jest.fn(),
                         setAddress2: jest.fn(),
                         setCountryCode: jest.fn(),
                         setCity: jest.fn(),
                         setFirstName: jest.fn(),
                         setLastName: jest.fn(),
                         setPhone: jest.fn(),
                         setStateCode: jest.fn()
                     },
}));
export const getBillingAddress = jest.fn(() => 'mocked_billing_address');
export const getCurrentBasket = jest.fn(() => ({
  getShipments,
  setCustomerEmail: jest.fn(),
  getAllProductLineItems,
  getTotalGrossPrice,
  getPaymentInstruments,
  removePaymentInstrument: jest.fn(),
  custom: {
          	amazonExpressShopperDetails: JSON.stringify({
          	    billingAddress: {
                    addressLine1: "address1",
                    addressLine2: "mocked address2",
                    phone: "mocked phone",
                    postalCode: "mocked postalCode",
                    countryCode: "mocked CC",
                    city: "mocked city",
                    name: "mocked name",
                    state: "mocked state"
          	    },
                shippingAddress: {
                    addressLine1: "address1",
                    addressLine2: "mocked address2",
                    phone: "mocked phone",
                    postalCode: "mocked postalCode",
                    countryCode: "mocked CC",
                    city: "mocked city",
                    name: "mocked name",
                    state: "mocked state"
                },
                buyer: {
                    email: 'mockedEmail'
                }
          	})
          },
  getUUID: jest.fn(),
  createBillingAddress,
  createPaymentInstrument: jest.fn(() => toArray()[0]),
  defaultShipment: getDefaultShipment(),
  getDefaultShipment: getDefaultShipment,
  billingAddress: createBillingAddress,
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
