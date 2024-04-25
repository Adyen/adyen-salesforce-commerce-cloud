/* eslint-disable global-require */
let deletePayment;
let res;
let req;

beforeEach(() => {
  const { paymentInstruments } = require('../../index');
  deletePayment = paymentInstruments.deletePayment;
  jest.clearAllMocks();
  res = { getViewData: jest.fn(() => ({ UUID: 'mocked_UUID' })) };
  req = { currentCustomer: { profile: { customerNo: 'mocked_customerNo' } } };
});

afterEach(() => {
  jest.resetModules();
});

describe('Delete Payment', () => {
  it('should do nothing if there is no payment', () => {
    const CustomerMgr = require('dw/customer/CustomerMgr');
    res.getViewData.mockImplementation(() => false);
    deletePayment(req, res, jest.fn());
    expect(CustomerMgr.getCustomerByCustomerNumber).toBeCalledTimes(0);
  });
  it('should not delete payment if theres no token', () => {
    const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    const {
      deleteRecurringPayment,
    } = require('*/cartridge/adyen/scripts/payments/adyenDeleteRecurringPayment');
    AdyenHelper.getCardToken.mockImplementation(() => false);
    deletePayment(req, res, jest.fn());
    expect(deleteRecurringPayment).toBeCalledTimes(0);
  });
  it('should delete recurring payment', () => {
    const {
      deleteRecurringPayment,
    } = require('*/cartridge/adyen/scripts/payments/adyenDeleteRecurringPayment');
    deletePayment(req, res, jest.fn());
    expect(deleteRecurringPayment).toBeCalledTimes(1);
  });
});
