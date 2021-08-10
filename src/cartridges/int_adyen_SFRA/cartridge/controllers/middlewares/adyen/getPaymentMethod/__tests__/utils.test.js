const {
  getCustomer,
  getCountryCode,
  getConnectedTerminals,
} = require('../utils');

let CustomerMgr;
let BasketMgr;
let PaymentMgr;
beforeEach(() => {
  jest.clearAllMocks();
  CustomerMgr = require('dw/customer/CustomerMgr');
  BasketMgr = require('dw/order/BasketMgr');
  PaymentMgr = require('dw/order/PaymentMgr');
});

describe('Utils', () => {
  it('should get customer', () => {
    const customer = { profile: { customerNo: 'mocked_customerNo' } };
    const result = getCustomer(customer);
    expect(result).toMatchSnapshot();
    expect(
      CustomerMgr.getCustomerByCustomerNumber.mock.calls,
    ).toMatchSnapshot();
  });
  it('should return null if there is no customer profile', () => {
    const result = getCustomer({ currentCustomer: null });
    expect(result).toBeFalsy();
  });
  it('should get country code from shipping address', () => {
    const currentBasket = BasketMgr.getCurrentBasket();
    const countryCode = getCountryCode(currentBasket, { id: 'NL' });
    expect(BasketMgr.getCountryCode).toBeCalledTimes(1);
    expect(countryCode).toEqual('NL');
  });

  it('should get country code from Locale when its not provided in address', () => {
    const currentBasket = { getShipments: jest.fn() };
    const countryCode = getCountryCode(currentBasket, { id: 'NL' });
    expect(BasketMgr.getCountryCode).toBeCalledTimes(0);
    expect(countryCode).toEqual('NL');
  });

  it('should get connected Terminals', () => {
    const result = getConnectedTerminals();
    expect(result).toMatchSnapshot();
  });
  it('should return json string when terminal is not active', () => {
    PaymentMgr.isActive.mockImplementation(() => false);
    const result = getConnectedTerminals();
    expect(result).toEqual('{}');
  });
});
