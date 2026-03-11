/* eslint-disable global-require */
let paymentFromComponent;
let res;
let req;

beforeEach(() => {
  const { adyen } = require('../../../../controllers/middlewares/index');
  paymentFromComponent = adyen.paymentFromComponent;
  jest.clearAllMocks();
  req = {
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
});
