/* eslint-disable global-require */
let req;
let res;
let next;
let authorizeWithForm;

afterEach(() => {
  jest.resetModules();
});

beforeEach(() => {
  const { adyen } = require('../../index');
  authorizeWithForm = adyen.authorizeWithForm;

  jest.clearAllMocks();
  const MD = 'mocked_MD';
  window.session = {
    privacy: {
      orderNo: 'mocked_order_number',
      paymentMethod: 'Authorised',
      MD,
    },
    forms: {
      billing: {
        clearFormElement: jest.fn(),
      },
    },
  };

  req = {
    form: {
      MD,
      PaRes: 'mocked_paRes',
    },
    locale: {
      id: 'mocked_locale_id',
    },
  };

  res = {
    redirect: jest.fn(),
  };

  next = jest.fn();
});

function paymentNotValid() {
  const OrderMgr = require('dw/order/OrderMgr');
  const URLUtils = require('dw/web/URLUtils');
  const Resource = require('dw/web/Resource');

  expect(OrderMgr.failOrder).toBeCalledTimes(1);
  expect(URLUtils.url.mock.calls).toMatchSnapshot();
  expect(Resource.msg.mock.calls).toMatchSnapshot();
}

describe('Authorize with Form', () => {
  it('should log error when theres no session privacy', () => {
    const Logger = require('dw/system/Logger');
    const URLUtils = require('dw/web/URLUtils');

    window.session.privacy = {};
    authorizeWithForm(req, res, next);
    expect(Logger.error).toHaveBeenCalledWith(
      'Session variable does not exists',
    );
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should call getOrder and getPaymentInstruments', () => {
    const OrderMgr = require('dw/order/OrderMgr');

    authorizeWithForm(req, res, next);
    expect(OrderMgr.getOrder).toBeCalledTimes(1);
    expect(OrderMgr.getPaymentInstruments).toBeCalledTimes(1);
  });
  it('should log error if privacy MD doesnt match form MD', () => {
    const Logger = require('dw/system/Logger');

    window.session.privacy.MD = 'invalid_mocked_MD';
    authorizeWithForm(req, res, next);
    expect(Logger.error).toHaveBeenCalledWith(
      'Session variable does not exists',
    );
  });

  it("should call 'failOrder' if result has error", () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({
      error: true,
    });
    authorizeWithForm(req, res, next);
    paymentNotValid();
  });
  it("should call 'failOrder' if result code is not 'Authorised'", () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const OrderMgr = require('dw/order/OrderMgr');

    adyenCheckout.doPaymentDetailsCall.mockReturnValue({
      resultCode: 'Not_Authorised',
    });
    authorizeWithForm(req, res, next);
    expect(OrderMgr.failOrder).toBeCalledTimes(1);
  });
  it("should call 'failOrder' if 'placeOrder' returns error", () => {
    const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    COHelpers.placeOrder.mockReturnValue({
      error: true,
    });
    authorizeWithForm(req, res, next);
    paymentNotValid();
    COHelpers.placeOrder.mockClear();
  });
  it('should confirm order', () => {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const URLUtils = require('dw/web/URLUtils');
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({
      resultCode: 'Authorised',
    });
    authorizeWithForm(req, res, next);
    expect(URLUtils.url.mock.calls[0][0]).toEqual('Order-Confirm');
  });
});
