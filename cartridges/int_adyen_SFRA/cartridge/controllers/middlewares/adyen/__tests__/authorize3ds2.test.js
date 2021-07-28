"use strict";

/* eslint-disable global-require */
var req;
var res;
var authorize3ds2;
var adyenHelper;
beforeEach(function () {
  var _require = require('../../index'),
      adyen = _require.adyen;

  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  authorize3ds2 = adyen.authorize3ds2;
  jest.clearAllMocks();
  req = {
    form: {
      resultCode: 'IdentifyShopper',
      stateData: '{"details": {"mockeddetails":"mockedvalue"}}'
    },
    locale: {
      id: 'nl_NL'
    }
  };
  res = {
    redirect: jest.fn(),
    render: jest.fn()
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Authorize 3DS2', function () {
  it('should go to error page when authorisation fails', function () {
    var URLUtils = require('dw/web/URLUtils');

    var Logger = require('dw/system/Logger');

    authorize3ds2({}, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
  it('should do payments call with resultcode IdentifyShopper', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    authorize3ds2(req, res, jest.fn());
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls).toMatchSnapshot();
  });
  it('should do payments call with resultcode ChallengeShopper', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    req.form.resultCode = 'ChallengeShopper';
    authorize3ds2(req, res, jest.fn());
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls).toMatchSnapshot();
  });
  it('should redirect if form resultCode is invalid', function () {
    var URLUtils = require('dw/web/URLUtils');

    var Logger = require('dw/system/Logger');

    req.form.resultCode = 'Invalid';
    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
  it('should call fail order and redirect if result has error', function () {
    var URLUtils = require('dw/web/URLUtils');

    var OrderMgr = require('dw/order/OrderMgr');

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(function () {
      return {
        error: true
      };
    });
    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(OrderMgr.failOrder).toBeCalledTimes(1);
  });
  it('should redirect when result contains action', function () {
    var URLUtils = require('dw/web/URLUtils');

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'ChallengeShopper',
        action: 'mocked_action'
      };
    });
    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should error when placing order', function () {
    var URLUtils = require('dw/web/URLUtils');

    var OrderMgr = require('dw/order/OrderMgr');

    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'Authorised'
      };
    });
    COHelpers.placeOrder.mockImplementation(function () {
      return {
        error: true
      };
    });
    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(OrderMgr.failOrder).toBeCalledTimes(1);
  });
  it('should complete authorization for SFRA5', function () {
    var URLUtils = require('dw/web/URLUtils');

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'Authorised'
      };
    });
    authorize3ds2(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should complete authorization for SFRA6', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(true);
    adyenCheckout.doPaymentDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'Authorised'
      };
    });
    authorize3ds2(req, res, jest.fn());
    expect(res.render.mock.calls).toMatchSnapshot();
  });
});