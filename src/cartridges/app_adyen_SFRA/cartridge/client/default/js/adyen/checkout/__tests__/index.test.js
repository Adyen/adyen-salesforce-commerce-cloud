/**
 * @jest-environment jsdom
 */
jest.mock('../../commons', () => ({ getPaymentMethods: jest.fn() }));
jest.mock('../renderPaymentMethod', () => ({ renderCheckout: jest.fn() }));
jest.mock('../giftcards', () => ({ renderGiftCards: jest.fn() }));
jest.mock('../pos', () => ({ addStores: jest.fn() }));
jest.mock('../fastlane', () => ({
  mountFastlaneWatermark: jest.fn(),
  fastlaneAuthenticate: jest.fn(),
  initFastlane: jest.fn(),
  getFastlaneShopperDetails: jest.fn(),
}));
jest.mock('../../../checkout/billing', () => ({
  methods: { updatePaymentInformation: jest.fn() },
}));

const flush = async () => {
  for (let i = 0; i < 10; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

const buildResponse = (overrides = {}) => ({
  AdyenPaymentMethods: {
    paymentMethods: [{ type: 'scheme' }, { type: 'applepay' }],
    storedPaymentMethods: [],
  },
  countryCode: 'US',
  shopperEmail: 'shopper@example.com',
  amount: { value: 1000, currency: 'USD' },
  ...overrides,
});

const selectShippingMethod = () =>
  $(document).trigger('ajaxComplete', [
    { status: 200 },
    { url: '/CheckoutShippingServices-SelectShippingMethod' },
  ]);

describe('checkout index', () => {
  let checkoutIndex;
  let store;
  let getPaymentMethods;
  let renderCheckout;
  let checkoutInstance;
  let schemeNode;
  let applePayNode;

  beforeEach(() => {
    jest.resetModules();
    $(document).off();
    $('body').off();
    window.arePaymentMethodsRendering = false;
    window.AdyenWeb = {
      AdyenCheckout: jest.fn(async () => checkoutInstance),
      createComponent: jest.fn(),
    };
    checkoutInstance = { update: jest.fn(async () => checkoutInstance) };
    schemeNode = { update: jest.fn() };
    applePayNode = { update: jest.fn() };

    store = require('../../../../../../config/store');
    store.checkout = null;
    store.componentsObj = {};
    store.fastlane = {};
    ({ getPaymentMethods } = require('../../commons'));
    ({ renderCheckout } = require('../renderPaymentMethod'));
    renderCheckout.mockImplementation(async () => {
      store.componentsObj = {
        scheme: { node: schemeNode },
        applepay: { node: applePayNode },
      };
    });

    checkoutIndex = require('../index');
    checkoutIndex.registerRenderPaymentMethodListener();
    checkoutIndex.handlePaymentAction();
    checkoutIndex.registerUpdateCheckoutView();
  });

  async function renderInitially(response = buildResponse()) {
    getPaymentMethods.mockResolvedValueOnce(response);
    await checkoutIndex.refreshPaymentMethods();
    expect(renderCheckout).toHaveBeenCalledTimes(1);
    expect(window.AdyenWeb.AdyenCheckout).toHaveBeenCalledTimes(1);
  }

  it('updates the amount in place when only the amount changes', async () => {
    await renderInitially();
    const newAmount = { value: 1500, currency: 'USD' };
    getPaymentMethods.mockResolvedValueOnce(
      buildResponse({ amount: newAmount }),
    );

    selectShippingMethod();
    await flush();

    expect(window.AdyenWeb.AdyenCheckout).toHaveBeenCalledTimes(1);
    expect(renderCheckout).toHaveBeenCalledTimes(1);
    expect(window.AdyenWeb.createComponent).not.toHaveBeenCalled();
    expect(checkoutInstance.update).toHaveBeenCalledWith(
      { amount: newAmount },
      { shouldReinitializeCheckout: false },
    );
    expect(schemeNode.update).not.toHaveBeenCalled();
    expect(applePayNode.update).not.toHaveBeenCalled();
    expect(store.checkoutConfiguration.amount).toEqual(newAmount);
  });

  it('re-renders when the payment method list changes', async () => {
    await renderInitially();
    getPaymentMethods.mockResolvedValueOnce(
      buildResponse({
        AdyenPaymentMethods: {
          paymentMethods: [{ type: 'scheme' }],
          storedPaymentMethods: [],
        },
      }),
    );

    selectShippingMethod();
    await flush();

    expect(renderCheckout).toHaveBeenCalledTimes(2);
    expect(window.AdyenWeb.AdyenCheckout).toHaveBeenCalledTimes(2);
    expect(checkoutInstance.update).not.toHaveBeenCalled();
  });

  it('re-renders when the shipping country changes', async () => {
    await renderInitially();
    getPaymentMethods.mockResolvedValueOnce(buildResponse({ countryCode: 'NL' }));

    $('body').trigger('checkout:updateCheckoutView', {
      order: {
        orderEmail: 'shopper@example.com',
        shipping: [{ shippingAddress: { countryCode: { value: 'NL' } } }],
      },
    });
    await flush();

    expect(renderCheckout).toHaveBeenCalledTimes(2);
  });

  it('does not refresh when the shipping country stays the same', async () => {
    await renderInitially();

    $('body').trigger('checkout:updateCheckoutView', {
      order: {
        orderEmail: 'shopper@example.com',
        shipping: [{ shippingAddress: { countryCode: { value: 'US' } } }],
      },
    });
    await flush();

    expect(getPaymentMethods).toHaveBeenCalledTimes(1);
    expect(renderCheckout).toHaveBeenCalledTimes(1);
  });

  it('re-renders when the shopper email changes', async () => {
    await renderInitially();
    getPaymentMethods.mockResolvedValueOnce(buildResponse());

    await checkoutIndex.refreshPaymentMethods('other@example.com');

    expect(renderCheckout).toHaveBeenCalledTimes(2);
  });

  it('always re-renders on an explicit render request', async () => {
    await renderInitially();

    $('body').trigger('checkout:renderPaymentMethod', {
      email: 'shopper@example.com',
    });
    await flush();

    expect(renderCheckout).toHaveBeenCalledTimes(2);
  });

  it('renders only once when two refreshes arrive together', async () => {
    getPaymentMethods.mockResolvedValue(buildResponse());

    checkoutIndex.refreshPaymentMethods();
    selectShippingMethod();
    selectShippingMethod();
    await flush();

    expect(renderCheckout).toHaveBeenCalledTimes(1);
    expect(window.AdyenWeb.AdyenCheckout).toHaveBeenCalledTimes(1);
    expect(getPaymentMethods).toHaveBeenCalledTimes(2);
    expect(window.arePaymentMethodsRendering).toBe(false);
  });

  it('builds the same signature regardless of method order', () => {
    const a = buildResponse();
    const b = buildResponse({
      AdyenPaymentMethods: {
        paymentMethods: [{ type: 'applepay' }, { type: 'scheme' }],
        storedPaymentMethods: [],
      },
    });
    expect(checkoutIndex.getRenderSignature(a, 'x@y.com')).toBe(
      checkoutIndex.getRenderSignature(b, 'x@y.com'),
    );
    expect(checkoutIndex.getRenderSignature(a, 'x@y.com')).not.toBe(
      checkoutIndex.getRenderSignature(a, 'z@y.com'),
    );
  });
});
