/* eslint-disable global-require */

let req;
let res;
let authorize3ds2;
let adyenHelper;

beforeEach(() => {
  const { adyen } = require('../../index');
  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  authorize3ds2 = adyen.authorize3ds2;

  jest.clearAllMocks();

  req = {
    form: {
      resultCode: 'IdentifyShopper',
      stateData: '{"details": {"mockeddetails":"mockedvalue"}}'
    },
    locale: {
      id: 'nl_NL',
    },
  };
  res = {
    redirect: jest.fn(),
    render: jest.fn(),
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Authorize 3DS2', () => {
  it('should go to error page when authorisation fails', () => {
    const URLUtils = require('dw/web/URLUtils');
    const Logger = require('dw/system/Logger');

    authorize3ds2({}, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
  it('should do payments call with resultcode IdentifyShopper', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    authorize3ds2(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls).toMatchSnapshot();
  });
  it('should do payments call with resultcode ChallengeShopper', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    req.form.resultCode = 'ChallengeShopper';
    authorize3ds2(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls).toMatchSnapshot();
  });
  it('should redirect if form resultCode is invalid', () => {
    const URLUtils = require('dw/web/URLUtils');
    const Logger = require('dw/system/Logger');
    req.form.resultCode = 'Invalid';

    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
  it('should call fail order and redirect if result has error', () => {
    const URLUtils = require('dw/web/URLUtils');
    const OrderMgr = require('dw/order/OrderMgr');
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      error: true,
    }));

    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(OrderMgr.failOrder).toBeCalledTimes(1);
  });
  it('should redirect when result contains action', () => {
    const URLUtils = require('dw/web/URLUtils');
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode: 'ChallengeShopper',
      action: 'mocked_action',
    }));
    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should error when placing order', () => {
    const URLUtils = require('dw/web/URLUtils');
    const OrderMgr = require('dw/order/OrderMgr');
    const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode: 'Authorised',
    }));

    COHelpers.placeOrder.mockImplementation(() => ({
      error: true,
    }));

    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(OrderMgr.failOrder).toBeCalledTimes(1);
  });

  it('should complete authorization for SFRA5', () => {
    const URLUtils = require('dw/web/URLUtils');
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode: 'Authorised',
    }));

    authorize3ds2(req, res, jest.fn());

    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });

  it('should complete authorization for SFRA6', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(true);
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(() => ({
      resultCode: 'Authorised',
    }));

    authorize3ds2(req, res, jest.fn());

    expect(res.render.mock.calls).toMatchSnapshot();
  });
});
