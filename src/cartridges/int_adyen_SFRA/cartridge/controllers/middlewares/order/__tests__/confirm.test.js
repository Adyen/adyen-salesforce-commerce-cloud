/* eslint-disable global-require */
let confirm;
let req;
let res;
let viewData = {"adyen": {"adyenGivingAvailable": true, "adyenGivingBackgroundUrl": "mocked_background_url", "adyenGivingLogoUrl": "mocked_logo_url", "charityDescription": "%25mocked_charity_description%25", "charityName": "%25mocked_charity_name%25", "charityWebsite": "mocked_charity_website", "clientKey": "mocked_client_key", "donationAmounts": "{\"currency\":\"EUR\",\"values\":[10,20,30]}", "environment": "test", "orderToken": "mocked_token"}}
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
    const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    AdyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    AdyenHelper.getAdyenGivingConfig.mockImplementation(() => null);
    confirm(req, res, jest.fn());
    expect(res.setViewData).toBeCalledTimes(0);
  });
  it('should set view data', () => {
    const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    AdyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    confirm(req, res, jest.fn());
    expect(res.setViewData).toMatchSnapshot();
  });
  it('check if encrypted', () => {
    confirm(req, res, jest.fn());
    expect(res.setViewData).toBeCalledWith(viewData);
  });
});
