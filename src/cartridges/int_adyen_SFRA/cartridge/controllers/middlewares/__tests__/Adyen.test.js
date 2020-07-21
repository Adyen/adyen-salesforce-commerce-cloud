const { authorizeWithForm } = require("../../utils/authorizeWithForm");

let req;
let res;
let next;
let adyenCheckout;
let COHelpers;
let Logger;
let OrderMgr;

beforeEach(() => {
  adyenCheckout = require("*/cartridge/scripts/adyenCheckout");
  COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
  Logger = require("dw/system/Logger");
  OrderMgr = require("dw/order/OrderMgr");

  const MD = "mocked_MD";
  window.session = {
    privacy: {
      orderNo: "mocked_order_number",
      paymentMethod: "Authorised",
      MD,
    },
  };

  req = {
    form: {
      MD,
      PaRes: "mocked_paRes",
    },
    locale: {
      id: "mocked_locale_id",
    },
  };

  res = {
    redirect: jest.fn(),
  };

  next = jest.fn();
});

describe("Authorize with Form", () => {
  it("should not throw", (done) => {
    try {
      authorizeWithForm(req, res, next);
      expect(Logger.getLogger).toHaveBeenCalledTimes(0);
      done();
    } catch (e) {
      done.fail(e);
    }
  });

  it("should not be authorised", (done) => {
    adyenCheckout.doPaymentDetailsCall.mockImplementation(() => ({
      error: true,
    }));
    try {
      authorizeWithForm(req, res, next);
      expect(Logger.getLogger).toHaveBeenCalledTimes(0);
      done();
    } catch (e) {
      done.fail(e);
    }
  });

  it("should fail to place order", (done) => {
    COHelpers.placeOrder.mockImplementation(() => ({
      error: true,
    }));
    try {
      authorizeWithForm(req, res, next);
      expect(Logger.getLogger).toHaveBeenCalledTimes(0);
      done();
    } catch (e) {
      done.fail(e);
    }
  });

  it("should throw on getOrder", () => {
    OrderMgr.getOrder = jest.fn(() => {
      throw "custom error";
    });

    authorizeWithForm(req, res, next);
    expect(Logger.getLogger).toHaveBeenCalledWith("Adyen");
  });
});
