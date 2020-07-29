/* eslint-disable global-require */

let req;
let res;
let authorize3ds2;
beforeEach(() => {
  authorize3ds2 = require('../authorize3ds2');
  jest.clearAllMocks();

  window.session = {
    privacy: {
      orderNo: 'mocked_orderNo',
      paymentMethod: 'mocked_pm',
    },
    forms: {
      billing: {
        clearFormElement: jest.fn(),
      },
    },
  };
  req = {
    form: {
      resultCode: 'IdentifyShopper',
      fingerprintResult: 'mocked_fingerprint_result',
      challengeResult: 'mocked_challenge_result',
    },
    locale: {
      id: 'nl_NL',
    },
  };
  res = {
    redirect: jest.fn(),
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Authorize 3DS2', () => {
  it('should go to error page when there is no session', () => {
    const URLUtils = require('dw/web/URLUtils');
    const Logger = require('dw/system/Logger');

    window.session.privacy = {};

    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
  it('should do payments call with fingerprint', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    authorize3ds2(req, res, jest.fn());
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls).toMatchSnapshot();
  });
  it('should do payments call with challengeResult', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    req.form.resultCode = 'ChallengeShopper';
    authorize3ds2(req, res, jest.fn());
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls).toMatchSnapshot();
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

    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      error: true,
    }));

    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(OrderMgr.failOrder).toBeCalledTimes(1);
  });
  it('should redirect when resultCode is ChallengeShopper', () => {
    const URLUtils = require('dw/web/URLUtils');
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      resultCode: 'ChallengeShopper',
      authentication: {
        'threeds2.challengeToken': 'mocked_challenge_token',
      },
    }));

    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should error when placing order', () => {
    const URLUtils = require('dw/web/URLUtils');
    const OrderMgr = require('dw/order/OrderMgr');
    const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      resultCode: 'Authorised',
    }));

    COHelpers.placeOrder.mockImplementation(() => ({
      error: true,
    }));

    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(OrderMgr.failOrder).toBeCalledTimes(1);
  });
  it('should complete authorization', () => {
    const URLUtils = require('dw/web/URLUtils');
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      resultCode: 'Authorised',
    }));

    authorize3ds2(req, res, jest.fn());

    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
});
