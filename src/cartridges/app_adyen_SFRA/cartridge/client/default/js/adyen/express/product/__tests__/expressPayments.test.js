/**
 * @jest-environment ./jest/customJsdomEnvironment.js
 */

const mockCalculateProductPrice = jest.fn();
const mockApplePay = jest.fn();
const mockPaypal = jest.fn();

jest.mock('../../../commons/index', () => ({
  getExpressPaymentMethods: jest.fn(),
  calculateProductPrice: mockCalculateProductPrice,
}));

jest.mock('../../../commons/httpClient', () => ({
  httpClient: jest.fn(),
}));

jest.mock('../../paymentMethods', () => ({
  ApplePay: mockApplePay,
  GooglePay: jest.fn(),
  Paypal: mockPaypal,
}));

jest.mock('../../../../../../../config/constants', () => ({
  APPLE_PAY: 'applepay',
  GOOGLE_PAY: 'googlepay',
  PAY_WITH_GOOGLE: 'paywithgoogle',
  PAYPAL: 'paypal',
}));

const expressPayments = require('../expressPayments');

describe('PDP Express Payments', () => {
  const paymentMethodsResponse = {
    AdyenPaymentMethods: {
      paymentMethods: [
        { type: 'applepay', configuration: {} },
        { type: 'paypal', configuration: {} },
      ],
    },
    applicationInfo: {},
    adyenTranslations: {},
    amount: { currency: 'BHD' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    $('body').off();
    document.body.innerHTML = `
      <input id="selected-express-product" data-pid="test-product-id" />
      <input name="Quantity" value="1" />
    `;

    mockApplePay.mockImplementation(() => ({
      getComponent: jest.fn().mockResolvedValue({ mount: jest.fn() }),
    }));
    mockPaypal.mockImplementation(() => ({
      getComponent: jest.fn().mockResolvedValue({ mount: jest.fn() }),
    }));
  });

  afterEach(() => {
    $('body').off();
  });

  async function renderPaymentButtons() {
    expressPayments.renderApplePayButton();
    expressPayments.renderPaypalButton();

    $('body').trigger('product:renderapplepayButton', {
      paymentMethodsResponse,
      button: document.createElement('div'),
    });
    $('body').trigger('product:renderpaypalButton', {
      paymentMethodsResponse,
      button: document.createElement('div'),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('uses the server-provided minor-unit value for Apple Pay and PayPal', async () => {
    mockCalculateProductPrice.mockResolvedValue({
      success: true,
      totalAmount: {
        value: 10.99,
        minorUnitValue: 10990,
        currencyCode: 'BHD',
      },
    });

    await renderPaymentButtons();

    expect(mockApplePay).toHaveBeenCalledWith({}, {}, {}, true, {
      value: 10990,
      currency: 'BHD',
    });
    expect(mockPaypal).toHaveBeenCalledWith({}, {}, {}, true, {
      value: 10990,
      currency: 'BHD',
    });
  });

  it('keeps the initial amount at zero when the minor-unit value is invalid', async () => {
    mockCalculateProductPrice.mockResolvedValue({
      success: true,
      totalAmount: {
        value: 10.99,
        minorUnitValue: 10990.5,
        currencyCode: 'BHD',
      },
    });

    await renderPaymentButtons();

    expect(mockApplePay).toHaveBeenCalledWith({}, {}, {}, true, {
      value: 0,
      currency: 'BHD',
    });
    expect(mockPaypal).toHaveBeenCalledWith({}, {}, {}, true, {
      value: 0,
      currency: 'BHD',
    });
  });
});
