export const getCountryCode = jest.fn(() => ({ value: 'NL' }));
export const getShipments = jest.fn(() => [
  {
    shippingAddress: {
      getCountryCode,
    },
  },
]);

export const createBillingAddress = {
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

export const getAllProductLineItems = jest.fn(() => ({
  toArray: jest.fn(() => [
    {
      custom: { adyenPaymentMethod: '' },
      paymentTransaction: {
        paymentProcessor: 'mocked_payment_processor',
        amount: {
          value: 'mockedValue',
          currencyCode: 'mockedValue',
        },
      },
      setCreditCardNumber,
      setCreditCardType,
      setCreditCardExpirationMonth,
      setCreditCardExpirationYear,
      setCreditCardToken,
      paymentMethod: 'AdyenComponent',
    },
  ]),
}));

export const isAvailable = jest.fn(() => true);
export const getTotalGrossPrice = jest.fn(() => ({
  currencyCode: 'EUR',
  isAvailable,
}));

export const getAdjustedMerchandizeTotalGrossPrice = jest.fn(() => ({
  currencyCode: 'EUR',
  isAvailable,
}));

export const getAdjustedMerchandizeTotalNetPrice = jest.fn(() => ({
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
export const getProductQuantityTotal = jest.fn();

export const toArray = jest.fn(() => [
  {
    custom: { adyenPaymentMethod: '' },
    paymentTransaction: {
      paymentProcessor: 'mocked_payment_processor',
      amount: {
        value: 'mockedValue',
        currencyCode: 'mockedValue',
      },
    },
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
    setPostalCode: jest.fn(),
    setAddress1: jest.fn(),
    setAddress2: jest.fn(),
    setCountryCode: jest.fn(),
    setCity: jest.fn(),
    setFirstName: jest.fn(),
    setLastName: jest.fn(),
    setPhone: jest.fn(),
    setStateCode: jest.fn(),
  },
}));
export const getBillingAddress = jest.fn(() => 'mocked_billing_address');

function formatCustomerObject(shopperDetails) {
  return {
    addressBook: {
      addresses: {},
      preferredAddress: {
        // for shipping address
        address1: shopperDetails.shippingAddress.addressLine1,
        address2: shopperDetails.shippingAddress.addressLine2,
        city: shopperDetails.shippingAddress.city,
        countryCode: {
          value: shopperDetails.shippingAddress.countryCode,
        },
        phone: shopperDetails.shippingAddress.phoneNumber,
        firstName: shopperDetails.shippingAddress.name.split(' ')[0],
        lastName: shopperDetails.shippingAddress.name.split(' ')[1],
        postalCode: shopperDetails.shippingAddress.postalCode,
        stateCode: shopperDetails.shippingAddress.stateOrRegion,
      },
    },
    billingAddressDetails: {
      address1: shopperDetails.billingAddress.addressLine1,
      address2: shopperDetails.billingAddress.addressLine2,
      city: shopperDetails.billingAddress.city,
      countryCode: {
        value: shopperDetails.billingAddress.countryCode,
      },
      phone: shopperDetails.billingAddress.phoneNumber,
      firstName: shopperDetails.billingAddress.name.split(' ')[0],
      lastName: shopperDetails.billingAddress.name.split(' ')[1],
      postalCode: shopperDetails.billingAddress.postalCode,
      stateCode: shopperDetails.billingAddress.stateOrRegion,
    },
    customer: {},
    profile: {
      firstName: shopperDetails.buyer.name,
      lastName: shopperDetails.buyer.name,
      email: shopperDetails.buyer.email,
      phone: shopperDetails.buyer.phoneNumber,
    },
  };
}

export const getCurrentBasket = jest.fn(() => ({
  getShipments,
  setCustomerEmail: jest.fn(),
  getAllProductLineItems,
  getProductQuantityTotal,
  getTotalGrossPrice,
  getAdjustedMerchandizeTotalGrossPrice,
  getAdjustedMerchandizeTotalNetPrice,
  getPaymentInstruments,
  removeAllPaymentInstruments: jest.fn(),
  removePaymentInstrument: jest.fn(),
  custom: {
    adyenProductLineItems: 'mocked_hash',
    amazonExpressShopperDetails: JSON.stringify({
      billingAddressDetails: {
        address1: 'address1',
        address2: 'mocked address2',
        phone: 'mocked phone',
        postalCode: 'mocked postalCode',
        countryCode: 'mocked CC',
        city: 'mocked city',
        lastName: 'mocked name',
        firstName: 'mocked name',
        stateCode: 'mocked state',
      },
      addressBook: {
        preferredAddress: {
          address1: 'address1',
          address2: 'mocked address2',
          phone: 'mocked phone',
          postalCode: 'mocked postalCode',
          countryCode: 'mocked CC',
          city: 'mocked city',
          lastName: 'mocked name',
          firstName: 'mocked name',
          stateCode: 'mocked state',
        },
      },
      profile: {
        email: 'mockedEmail',
        phone: 'mockedphone',
        firstName: 'mocked name',
        lastName: 'mocked name',
      },
    }),
  },
  getUUID: jest.fn(),
  createBillingAddress: jest.fn(() => createBillingAddress),
  createPaymentInstrument: jest.fn(() => toArray()[0]),
  defaultShipment: getDefaultShipment(),
  getDefaultShipment,
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
