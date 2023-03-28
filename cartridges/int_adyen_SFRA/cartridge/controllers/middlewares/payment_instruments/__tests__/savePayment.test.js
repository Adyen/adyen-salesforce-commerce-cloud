"use strict";

/* eslint-disable global-require */
var savePayment;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
    paymentInstruments = _require.paymentInstruments;
  savePayment = paymentInstruments.savePayment;
  jest.clearAllMocks();
  res = {
    json: jest.fn()
  };
  req = {
    currentCustomer: {
      profile: {
        customerNo: 'mocked_customerNo'
      }
    }
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Save Payment', function () {
  it('should do nothing if payment processor is not Adyen', function () {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var server = require('server');
    PaymentMgr.getPaymentMethod.mockImplementation(function () {
      return {
        getPaymentProcessor: jest.fn(function () {
          return {
            getID: jest.fn(function () {
              return 'notAdyen';
            })
          };
        }),
        isActive: jest.fn(function () {
          return false;
        })
      };
    });
    savePayment.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(server.forms.getForm).toBeCalledTimes(0);
  });
  it('should fail if zeroAuth has error', function () {
    var adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');
    adyenZeroAuth.zeroAuthPayment.mockImplementation(function () {
      return {
        error: true
      };
    });
    savePayment.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if resultCode is not Authorised', function () {
    var adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');
    adyenZeroAuth.zeroAuthPayment.mockImplementation(function () {
      return {
        resultCode: 'Not_Authorised'
      };
    });
    savePayment.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should succeed', function () {
    savePayment.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should return redirectAction and succeed', function () {
    var adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');
    adyenZeroAuth.zeroAuthPayment.mockReturnValue({
      resultCode: 'RedirectShopper',
      action: {
        paymentMethodType: "scheme",
        url: "https://checkoutshopper-test.adyen.com/checkoutshopper/threeDS2.shtml",
        data: {
          MD: "mockMD",
          PaReq: "mockPaReq",
          TermUrl: "https://checkoutshopper-test.adyen.com/checkoutshopMock"
        },
        method: "POST",
        type: "redirect"
      }
    });
    savePayment.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});