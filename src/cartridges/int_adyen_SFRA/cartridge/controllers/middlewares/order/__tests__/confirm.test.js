/* eslint-disable global-require */
let confirm;
let req;
let res;
jest.mock('*/cartridge/adyen/scripts/donations/adyenGiving', () => ({
	getActiveCampaigns: jest.fn(() => ({
	  donationCampaigns: [
		{
		  nonprofitName: 'mocked_nonprofit',
		  nonprofitDescription: 'mocked_description',
		  nonprofitUrl: 'mocked_url',
		  logoUrl: 'mocked_logo_url',
		  bannerUrl: 'mocked_banner_url',
		  termsAndConditionsUrl: 'mocked_terms_url',
		  donation: { currency: 'EUR', values: [10, 20, 30] },
		},
	  ],
	})),
  }));
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
    AdyenHelper.isAdyenGivingAvailable.mockImplementation(() => null);
    confirm(req, res, jest.fn());
    expect(res.setViewData).toBeCalledTimes(0);
  });
  it('should set view data', () => {
    const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    AdyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    confirm(req, res, jest.fn());
    expect(res.setViewData).toMatchSnapshot();
  });
});
