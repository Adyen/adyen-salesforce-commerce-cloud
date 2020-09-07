/* eslint-disable global-require */
let req;
let res;
let redirect;

beforeEach(() => {
  const { adyen } = require('../../index');
  redirect = adyen.redirect;
  jest.clearAllMocks();
  req = {
    querystring: {
      signature: 'some_mocked_url/signature __ ocked_adyen_payment_data',
      redirectUrl: 'https://some_mocked_url/signature',
    },
  };

  res = {
    redirect: jest.fn(),
  };

  window.session = {
    privacy: {
      orderNo: 'mocked_orderNo',
    },
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Redirect', () => {
  it('should fail if there is no order and signature', () => {
    const OrderMgr = require('dw/order/OrderMgr');
    const Logger = require('dw/system/Logger');
    OrderMgr.getOrder.mockImplementation(() => null);
    redirect(req, res, jest.fn());
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
  it('should fail if signature doesnt match', () => {
    const Logger = require('dw/system/Logger');
    req.querystring.signature = 'mocked_wrong_signature';
    redirect(req, res, jest.fn());
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
  it('should redirect on valid signature', () => {
    const Logger = require('dw/system/Logger');
    redirect(req, res, jest.fn());
    expect(res.redirect).toBeCalledWith(req.querystring.redirectUrl);
    expect(Logger.error).toBeCalledTimes(0);
  });
});
