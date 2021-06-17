"use strict";

/* eslint-disable global-require */
var req;
var res;
var placeOrder;
beforeEach(function () {
  var _require = require('../../index'),
      checkoutServices = _require.checkoutServices;

  placeOrder = checkoutServices.placeOrder;
  jest.clearAllMocks();
  res = {
    getViewData: jest.fn(),
    json: jest.fn()
  };
  req = {
    session: {
      privacyCache: {
        get: jest.fn(),
        set: jest.fn()
      }
    },
    locale: {
      id: 'NL'
    },
    currentCustomer: {
      addressBook: true
    }
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Place Order', function () {
  it('should return error when basket is empty', function () {
    var BasketMgr = require('dw/order/BasketMgr');

    BasketMgr.getCurrentBasket.mockImplementation(function () {
      return false;
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should go to next middleware if payment instrument is not Adyen', function () {
    var next = jest.fn();

    var BasketMgr = require('dw/order/BasketMgr');

    BasketMgr.toArray.mockReturnValue([{
      paymentMethod: 'mocked_example'
    }]);
    placeOrder.call({
      emit: jest.fn()
    }, req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.getViewData).toHaveBeenCalledTimes(0);
  });
  it('should complete if viewData contains csrfError', function () {
    var emit = jest.fn();
    res.getViewData.mockImplementation(function () {
      return {
        csrfError: true
      };
    });
    placeOrder.call({
      emit: emit
    }, req, res, jest.fn());
    expect(emit.mock.calls).toMatchSnapshot();
  });
  it('should return error if privacy cache detect fraud', function () {
    req.session.privacyCache.get.mockImplementation(function () {
      return true;
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if order validation status is error', function () {
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    hooksHelper.mockImplementation(function () {
      return {
        error: true,
        message: 'mocked_order_validation_message'
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if shipping address is empty', function () {
    var BasketMgr = require('dw/order/BasketMgr');

    BasketMgr.getDefaultShipment.mockImplementation(function () {
      return {
        shippingAddress: null
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if billing address is empty', function () {
    var BasketMgr = require('dw/order/BasketMgr');

    BasketMgr.getBillingAddress.mockImplementation(function () {
      return false;
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if calculated payment total has error', function () {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    COHelpers.calculatePaymentTransaction.mockImplementation(function () {
      return {
        error: true
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if created order is empty', function () {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    COHelpers.createOrder.mockImplementation(function () {
      return null;
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if there is error on payment handle', function () {
    var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

    adyenHelpers.handlePayments.mockImplementation(function () {
      return {
        error: true
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should handle threeDS2', function () {
    var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

    adyenHelpers.handlePayments.mockImplementation(function () {
      return {
        threeDS2: true,
        resultCode: 'mocked_threeDS2_resultCode',
        action: 'mocked_action'
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should redirect with authorize3d', function () {
    var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

    adyenHelpers.handlePayments.mockImplementation(function () {
      return {
        authorized3d: true,
        redirectObject: {
          data: {
            MD: 'mocked_MD',
            PaReq: 'mocked_PaReq'
          },
          url: 'mocked_url'
        },
        orderNo: 'mocked_orderNo'
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should redirect without authorize3d', function () {
    var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

    adyenHelpers.handlePayments.mockImplementation(function () {
      return {
        authorized3d: false,
        redirectObject: true,
        orderNo: 'mocked_orderNo'
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if fraudDetection status returns "fail"', function () {
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    hooksHelper.mockImplementation(function () {
      return {
        status: 'fail',
        errorCode: 'mocked_fraud_fail'
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if placeOrder has error', function () {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    COHelpers.placeOrder.mockImplementation(function () {
      return {
        error: true
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should return json response', function () {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(COHelpers.sendConfirmationEmail).toBeCalledTimes(1);
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});