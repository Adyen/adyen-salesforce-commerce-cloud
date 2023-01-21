/* eslint-disable global-require */
let confirm;
let req;
let res;

beforeEach(() => {
  const { order } = require('../../index');
  confirm = order.confirm;
  jest.clearAllMocks();
  res = { setViewData: jest.fn(), getViewData: jest.fn(() => ({})) };
  req = { querystring: { ID: 'mocked_querystring_id', token: 'mocked_token' } };
});

afterEach(() => {
  jest.resetModules();
});

describe('Confirm', () => {
  it('should do nothing if giving is not enabled', () => {
    const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    AdyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    AdyenHelper.getAdyenGivingConfig.mockImplementation(() => null);
    confirm(req, res, jest.fn());
    expect(res.setViewData).toBeCalledTimes(0);
  });
  it('should do nothing if giving is not available', () => {
    const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    AdyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    AdyenHelper.isAdyenGivingAvailable.mockImplementation(() => false);
    confirm(req, res, jest.fn());
    expect(res.setViewData).toBeCalledTimes(0);
  });
  it('should set view data', () => {
    confirm(req, res, jest.fn());
    expect(res.setViewData).toMatchSnapshot();
  });
});
