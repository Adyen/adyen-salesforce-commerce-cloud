/* eslint-disable global-require */
let getPaymentMethods;
let req;
let res;
beforeEach(() => {
  getPaymentMethods = require('../getPaymentMethods').default;
  jest.clearAllMocks();
  res = { json: jest.fn() };
  req = {
    locale: { id: 'NL' },
    currentCustomer: { profile: { customerNo: 'mocked_customerNo' } },
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Get Payment Methods', () => {
  it('should get country code', () => {
    const { getCountryCode } = require('dw/order/BasketMgr');
    getPaymentMethods(req, res, jest.fn());
    expect(getCountryCode).toHaveBeenCalledTimes(1);
  });
  it('should get customer by customer number', () => {
    const { getCustomerByCustomerNumber } = require('dw/customer/CustomerMgr');
    getPaymentMethods(req, res, jest.fn());
    expect(getCustomerByCustomerNumber).toHaveBeenCalledWith(
      req.currentCustomer.profile.customerNo,
    );
  });
  it('should call get terminals if isActive', () => {
    const { isActive } = require('dw/order/PaymentMgr');
    getPaymentMethods(req, res, jest.fn());
    expect(isActive).toBeCalledTimes(1);
  });
  it('should handle installments when basket has total', () => {
    const {
      getCurrencyValueForApi,
    } = require('*/cartridge/scripts/util/adyenHelper');
    getPaymentMethods(req, res, jest.fn());
    expect(getCurrencyValueForApi).toBeCalledTimes(1);
    expect(res.json).toMatchSnapshot();
  });
  it('should handle installments when basket has no total', () => {
    const {
      getCurrencyValueForApi,
    } = require('*/cartridge/scripts/util/adyenHelper');
    const { getTotalGrossPrice } = require('dw/order/BasketMgr');
    getTotalGrossPrice.mockImplementation(() => false);
    getPaymentMethods(req, res, jest.fn());
    expect(getCurrencyValueForApi).toBeCalledTimes(0);
    expect(res.json).toMatchSnapshot();
  });
  it('should return response without installments', () => {
    const {
      getCreditCardInstallments,
    } = require('*/cartridge/scripts/util/adyenHelper');
    getCreditCardInstallments.mockImplementation(() => false);
    getPaymentMethods(req, res, jest.fn());
    expect(res.json).toMatchSnapshot();
  });
  it.skip('should return response without connected terminals', () => {
    const { isActive } = require('dw/order/PaymentMgr');
    isActive.mockImplementation(() => false);
    getPaymentMethods(req, res, jest.fn());
    expect(res.json).toMatchSnapshot();
  });
});
