"use strict";

/* eslint-disable global-require */
var req;
var res;
var next;
var authorizeWithForm;
var adyenHelper;
afterEach(function () {
  jest.resetModules();
});
beforeEach(function () {
  var _require = require('../../index'),
      adyen = _require.adyen;

  authorizeWithForm = adyen.authorizeWithForm;
  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  jest.clearAllMocks();
  req = {
    form: {
      MD: 'mocked_adyen_MD',
      PaRes: 'mocked_paRes'
    },
    locale: {
      id: 'mocked_locale_id'
    },
    querystring: {
      merchantReference: 'mocked_merchantReference'
    }
  };
  res = {
    redirect: jest.fn(),
    render: jest.fn()
  };
  next = jest.fn();
});

function paymentNotValid() {
  var OrderMgr = require('dw/order/OrderMgr');

  var URLUtils = require('dw/web/URLUtils');

  var Resource = require('dw/web/Resource');

  expect(OrderMgr.failOrder).toBeCalledTimes(1);
  expect(URLUtils.url.mock.calls).toMatchSnapshot();
  expect(Resource.msg.mock.calls).toMatchSnapshot();
}

describe('Authorize with Form', function () {
  it('should call getOrder and getPaymentInstruments', function () {
    var OrderMgr = require('dw/order/OrderMgr');

    authorizeWithForm(req, res, next);
    expect(OrderMgr.getOrder).toBeCalledTimes(2);
    expect(OrderMgr.getPaymentInstruments).toBeCalledTimes(1);
  });
  it('should log error if privacy MD doesnt match form MD', function () {
    var Logger = require('dw/system/Logger');

    req.form.MD = 'invalid_mocked_MD';
    authorizeWithForm(req, res, next);
    expect(Logger.error).toHaveBeenCalledWith('Not a valid MD');
  });
  it("should call 'failOrder' if result has error", function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      error: true,
      merchantReference: 'mocked_merchantReference'
    });
    authorizeWithForm(req, res, next);
    paymentNotValid();
  });
  it("should call 'failOrder' if result code is not 'Authorised'", function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var OrderMgr = require('dw/order/OrderMgr');

    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      resultCode: 'Not_Authorised',
      merchantReference: 'mocked_merchantReference'
    });
    authorizeWithForm(req, res, next);
    expect(OrderMgr.failOrder).toBeCalledTimes(1);
  });
  it("should call 'failOrder' if 'placeOrder' returns error", function () {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    COHelpers.placeOrder.mockReturnValue({
      error: true
    });
    authorizeWithForm(req, res, next);
    paymentNotValid();
    COHelpers.placeOrder.mockClear();
  });
  it('should confirm order for SFRA6', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(true);
    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      resultCode: 'Authorised',
      merchantReference: 'mocked_merchantReference'
    });
    authorizeWithForm(req, res, next);
    expect(res.render.mock.calls[0][0]).toEqual('orderConfirmForm');
  });
  it('should confirm order for SFRA5', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var URLUtils = require('dw/web/URLUtils');

    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      resultCode: 'Authorised',
      merchantReference: 'mocked_merchantReference'
    });
    authorizeWithForm(req, res, next);
    expect(URLUtils.url.mock.calls[0][0]).toEqual('Order-Confirm');
  });
});