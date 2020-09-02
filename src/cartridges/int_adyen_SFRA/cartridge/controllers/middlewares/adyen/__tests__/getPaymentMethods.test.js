/* eslint-disable global-require */
let getPaymentMethods;
let PaymentMgr;
let adyenHelper;
let BasketMgr;
let CustomerMgr;
let req;
let res;
beforeEach(() => {
  const { adyen } = require('../../index');
  getPaymentMethods = adyen.getPaymentMethods;
  PaymentMgr = require('dw/order/PaymentMgr');
  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  BasketMgr = require('dw/order/BasketMgr');
  CustomerMgr = require('dw/customer/CustomerMgr');
  jest.clearAllMocks();
  res = { json: jest.fn() };
  req = {
    locale: { id: 'NL' },
    currentCustomer: { profile: { customerNo: 'mocked_customerNo' } },
  };
});

describe('Get Payment Methods', () => {
  it('should get country code', () => {
    getPaymentMethods(req, res, jest.fn());
    expect(BasketMgr.getCountryCode).toHaveBeenCalledTimes(1);
  });
  it('should get customer by customer number', () => {
    getPaymentMethods(req, res, jest.fn());
    expect(CustomerMgr.getCustomerByCustomerNumber).toHaveBeenCalledWith(
      req.currentCustomer.profile.customerNo,
    );
  });
  it('should call get terminals if isActive', () => {
    getPaymentMethods(req, res, jest.fn());
    expect(PaymentMgr.isActive).toBeCalledTimes(1);
  });
  it('should handle installments when basket has total', () => {
    getPaymentMethods(req, res, jest.fn());
    expect(adyenHelper.getCurrencyValueForApi).toBeCalledTimes(1);
    expect(res.json).toMatchSnapshot();
  });
  it('should handle installments when basket has no total', () => {
    BasketMgr.getTotalGrossPrice.mockImplementation(() => false);
    getPaymentMethods(req, res, jest.fn());
    expect(adyenHelper.getCurrencyValueForApi).toBeCalledTimes(0);
    expect(res.json).toMatchSnapshot();
  });
  it('should return response without installments', () => {
    adyenHelper.getCreditCardInstallments.mockImplementation(() => false);
    getPaymentMethods(req, res, jest.fn());
    expect(res.json).toMatchSnapshot();
  });
  it('should return response without connected terminals', () => {
    PaymentMgr.isActive.mockImplementation(() => false);
    getPaymentMethods(req, res, jest.fn());
    expect(res.json).toMatchSnapshot();
  });
});
