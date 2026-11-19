/* eslint-disable global-require */
let paymentFromComponent;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');
  paymentFromComponent = adyen.paymentFromComponent;
  jest.clearAllMocks();
  req = {
    session: { privacyCache: { get: jest.fn(), set: jest.fn() } },
    form: {
      paymentMethod: 'method',
      data: {
        paymentMethod: {
          type: 'mocked_type'
        }
      }
    }
  };
  res = { redirect: jest.fn(), json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('Payment from Component', () => {
  it('should cancel transaction', () => {
    const URLUtils = require('dw/web/URLUtils');

    req.form.data.cancelTransaction = true;
    req.form.data.merchantReference = 'mocked_merchantReference';
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should return json response', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

    adyenCheckout.createPaymentRequest.mockReturnValue({
      resultCode: 'Authorised',
    });
    AdyenHelper.createOrder.mockReturnValue({
      orderNo: 'mocked_orderNo',
      orderToken: 'mocked_orderToken',
      custom: {
        Adyen_eventCode: null,
      },
    });

    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should authorize express payment with skipping summary page', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

    adyenCheckout.createPaymentRequest.mockReturnValue({
      resultCode: 'Authorised',
    });
    AdyenHelper.createOrder.mockReturnValue({
      orderNo: 'mocked_orderNo',
      orderToken: 'mocked_orderToken',
      custom: {
        Adyen_eventCode: null,
      },
    });

    req.form.data.paymentMethod.type = 'applepay';
    req.form.data.paymentMethod.paymentType = 'express';
    req.form.data.customer = {
      billingAddressDetails: {
        firstName: 'firstName',
        lastName: 'lastName',
        address1: 'address1',
        city: 'city',
        countryCode: { value: 'US' },
        postalCode: '12345',
      },
      profile: {
        email: 'email@example.com',
        firstName: 'firstName',
        lastName: 'lastName',
        phone: '1234567890',
      },
      addressBook: {
        preferredAddress: {
          address1: 'address1',
          city: 'city',
          countryCode: { value: 'US' },
          postalCode: '12345',
        },
      },
    };
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail the order on cancel when it is still CREATED', () => {
    const OrderMgr = require('dw/order/OrderMgr');
    const order = { status: { value: '0' } };
    OrderMgr.getOrder.mockReturnValueOnce(order);

    req.form.data.cancelTransaction = true;
    req.form.data.merchantReference = 'mocked_merchantReference';
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(OrderMgr.failOrder).toHaveBeenCalledWith(order, true);
    expect(res.redirect).toHaveBeenCalled();
  });
  it('should not fail an already failed order on cancel', () => {
    const OrderMgr = require('dw/order/OrderMgr');
    OrderMgr.getOrder.mockReturnValueOnce({ status: { value: '8' } });

    req.form.data.cancelTransaction = true;
    req.form.data.merchantReference = 'mocked_merchantReference';
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(OrderMgr.failOrder).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalled();
  });
  it('should not throw on cancel when the order and basket are missing', () => {
    const OrderMgr = require('dw/order/OrderMgr');
    const BasketMgr = require('dw/order/BasketMgr');
    OrderMgr.getOrder.mockReturnValueOnce(null);
    BasketMgr.getCurrentBasket.mockReturnValueOnce(null);

    req.form.data.cancelTransaction = true;
    req.form.data.merchantReference = 'mocked_merchantReference';
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(OrderMgr.failOrder).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalled();
  });
  it('should cache the PayPal order number and token to allow basket restore', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

    adyenCheckout.createPaymentRequest.mockReturnValue({
      resultCode: 'Pending',
    });
    AdyenHelper.createOrder.mockReturnValue({
      orderNo: 'mocked_orderNo',
      orderToken: 'mocked_orderToken',
      custom: {
        Adyen_eventCode: null,
      },
    });

    req.form.data.paymentMethod.type = 'paypal';
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(req.session.privacyCache.set).toHaveBeenCalledWith(
      'currentOrderNumber',
      'mocked_orderNo',
    );
    expect(req.session.privacyCache.set).toHaveBeenCalledWith(
      'currentOrderToken',
      'mocked_orderToken',
    );
  });
  it('should not cache the order for express PDP payments', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    const BasketMgr = require('dw/order/BasketMgr');

    adyenCheckout.createPaymentRequest.mockReturnValue({
      resultCode: 'Pending',
    });
    AdyenHelper.createOrder.mockReturnValue({
      orderNo: 'mocked_orderNo',
      orderToken: 'mocked_orderToken',
      custom: {
        Adyen_eventCode: null,
      },
    });
    BasketMgr.getTemporaryBasket = jest.fn(BasketMgr.getCurrentBasket);

    req.form.data.paymentMethod.type = 'paypal';
    req.form.data.isExpressPdp = true;
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json).toHaveBeenCalled();
    expect(req.session.privacyCache.set).not.toHaveBeenCalled();
  });
  it('should not cache the order for non-PayPal component payments', () => {
    const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
    const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

    adyenCheckout.createPaymentRequest.mockReturnValue({
      resultCode: 'Pending',
    });
    AdyenHelper.createOrder.mockReturnValue({
      orderNo: 'mocked_orderNo',
      orderToken: 'mocked_orderToken',
      custom: {
        Adyen_eventCode: null,
      },
    });

    req.form.data.paymentMethod.type = 'mbway';
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json).toHaveBeenCalled();
    expect(req.session.privacyCache.set).not.toHaveBeenCalled();
  });
});
