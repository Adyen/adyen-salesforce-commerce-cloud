/**
 * @jest-environment ./jest/customJsdomEnvironment.js
 */

const Paypal = require('../paymentMethods/paypal/paypal');
const store = require('../../../../../../config/store');
const helpers = require('../../checkout/helpers');

jest.mock('../../commons/httpClient');
jest.mock('../../../../../../config/store');
jest.mock('../../../../js/adyen/checkout/helpers');
jest.mock('../initializeCheckout');
jest.mock('../../commons');

describe('Paypal class', () => {
  let paypal;

  beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(global, 'window', {
      value: {
        AdyenWeb: {
          AdyenCheckout: jest.fn(),
          createComponent: jest.fn().mockImplementation(() => {}),
        },
        paypalReviewPageEnabled: false,
        returnURL: 'https://example.com/return',
        basketAmount: JSON.stringify({ value: 100, currency: 'USD' }),
        makeExpressPaymentsCall: 'https://example.com/make-express-payments',
        saveShopperData: 'https://example.com/save-shopper-data',
        makeExpressPaymentDetailsCall: 'https://example.com/make-express-payment-details',
        showConfirmationAction: 'https://example.com/show-confirmation',
        shippingMethodsUrl: 'https://example.com/shipping-methods',
        selectShippingMethodUrl: 'https://example.com/select-shipping-method',
        saveExpressPaymentDataUrl: 'https://example.com/save-express-payment-data',
      },
      writable: true,
    });

    document.body.innerHTML = `
      <input id="adyen-token" value="test-csrf-token" />
      <input id="additionalDetailsHidden" />
      <form id="showConfirmationForm"></form>
    `;

    global.$.ajax = jest.fn();
    global.$.spinner = jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    }));

    paypal = new Paypal(
      { merchantId: 'test-merchant' },
      { applicationInfo: 'Test Info' },
      { 'en-US': {} },
      false,
      null,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize correctly with default values', () => {
      expect(paypal.store).toBe(store);
      expect(paypal.helpers).toBe(helpers);
      expect(paypal.amount).toEqual({ value: 100, currency: 'USD' });
      expect(paypal.showPayButton).toBe(true);
      expect(paypal.isExpress).toBe(true);
      expect(paypal.isExpressPdp).toBe(false);
      expect(paypal.userAction).toBeNull();
      expect(paypal.returnUrl).toBe('https://example.com/return');
    });

    it('should initialize with custom initial amount', () => {
      const customAmount = { value: 200, currency: 'EUR' };
      const paypalWithAmount = new Paypal(
        { merchantId: 'test-merchant' },
        { applicationInfo: 'Test Info' },
        { 'en-US': {} },
        false,
        customAmount,
      );
      expect(paypalWithAmount.amount).toEqual(customAmount);
    });

    it('should initialize with isExpressPdp true', () => {
      const paypalPdp = new Paypal(
        { merchantId: 'test-merchant' },
        { applicationInfo: 'Test Info' },
        { 'en-US': {} },
        true,
        null,
      );
      expect(paypalPdp.isExpressPdp).toBe(true);
    });

    it('should set userAction to continue when paypalReviewPageEnabled is true', () => {
      window.paypalReviewPageEnabled = true;
      const paypalWithReview = new Paypal(
        { merchantId: 'test-merchant' },
        { applicationInfo: 'Test Info' },
        { 'en-US': {} },
        false,
        null,
      );
      expect(paypalWithReview.userAction).toBe('continue');
    });
  });

  describe('updateComponent', () => {
    it('should update component payment data on success', () => {
      const response = {
        paymentData: 'new-payment-data',
        status: 'success',
      };
      const component = {
        updatePaymentData: jest.fn(),
      };

      const result = Paypal.updateComponent(response, component);

      expect(component.updatePaymentData).toHaveBeenCalledWith('new-payment-data');
      expect(result).toBe(false);
    });

    it('should throw error when paymentData is missing', () => {
      const response = {
        status: 'success',
        errorMessage: 'No payment data',
      };
      const component = {
        updatePaymentData: jest.fn(),
      };

      expect(() => Paypal.updateComponent(response, component)).toThrow('No payment data');
    });

    it('should throw error when status is not success', () => {
      const response = {
        paymentData: 'payment-data',
        status: 'error',
        errorMessage: 'Payment failed',
      };
      const component = {
        updatePaymentData: jest.fn(),
      };

      expect(() => Paypal.updateComponent(response, component)).toThrow('Payment failed');
    });

    it('should throw error when response is falsy', () => {
      const component = {
        updatePaymentData: jest.fn(),
      };

      expect(() => Paypal.updateComponent(null, component)).toThrow();
    });
  });

  describe('onError', () => {
    it('should stop spinner', () => {
      const stopFn = jest.fn();
      global.$.spinner = jest.fn(() => ({ stop: stopFn }));

      Paypal.onError();

      expect(stopFn).toHaveBeenCalled();
    });
  });

  describe('callPaymentFromComponent', () => {
    it('should make payment call and handle action', async () => {
      const state = { data: { paymentMethod: 'paypal' } };
      const component = {
        handleAction: jest.fn(),
        handleError: jest.fn(),
      };
      const mockResponse = {
        fullResponse: {
          action: { type: 'redirect', url: 'https://paypal.com' },
        },
      };

      $.ajax.mockResolvedValue(mockResponse);

      await paypal.callPaymentFromComponent(state, component);

      expect($.ajax).toHaveBeenCalledTimes(1);
      expect(component.handleAction).toHaveBeenCalledWith(mockResponse.fullResponse.action);
    });


    it('should call handleError when no action in response', async () => {
      const state = { data: { paymentMethod: 'paypal' } };
      const component = {
        handleAction: jest.fn(),
        handleError: jest.fn(),
      };

      $.ajax.mockResolvedValue({ fullResponse: {} });

      await paypal.callPaymentFromComponent(state, component);

      expect(component.handleError).toHaveBeenCalled();
    });

    it('should handle errors from ajax call', async () => {
      const state = { data: { paymentMethod: 'paypal' } };
      const component = {
        handleAction: jest.fn(),
        handleError: jest.fn(),
      };
      const error = new Error('Network error');

      $.ajax.mockRejectedValue(error);

      await paypal.callPaymentFromComponent(state, component);

      expect(component.handleError).toHaveBeenCalledWith(error);
    });
  });

  describe('onAuthorized', () => {
    it('should save shopper data and resolve actions', async () => {
      const data = {
        authorizedEvent: {
          payer: {
            email_address: 'john@example.com',
            phone: { phone_number: { national_number: '1234567890' } },
            name: { given_name: 'John', surname: 'Doe' },
          },
        },
        billingAddress: { city: 'New York', country: 'US' },
        deliveryAddress: { city: 'New York', country: 'US' },
      };
      const actions = { resolve: jest.fn() };

      $.ajax.mockResolvedValue({});

      await paypal.onAuthorized(data, actions);

      expect($.ajax).toHaveBeenCalledTimes(1);
      expect(actions.resolve).toHaveBeenCalled();
    });

    it('should handle missing payer data gracefully', async () => {
      const data = {
        authorizedEvent: {},
        billingAddress: {},
        deliveryAddress: {},
      };
      const actions = { resolve: jest.fn() };

      $.ajax.mockResolvedValue({});

      await paypal.onAuthorized(data, actions);

      expect(actions.resolve).toHaveBeenCalled();
    });

    it('should stop spinner on error', async () => {
      const data = {
        authorizedEvent: { payer: {} },
        billingAddress: {},
        deliveryAddress: {},
      };
      const actions = { resolve: jest.fn() };
      const stopFn = jest.fn();
      global.$.spinner = jest.fn(() => ({ stop: stopFn }));

      $.ajax.mockRejectedValue(new Error('Network error'));

      await paypal.onAuthorized(data, actions);

      expect(stopFn).toHaveBeenCalled();
      expect(actions.resolve).not.toHaveBeenCalled();
    });
  });

  describe('makeExpressPaymentDetailsCall', () => {
    it('should make payment details call and set form data', async () => {
      const data = { paymentData: 'test-data' };
      const mockResponse = { orderID: '12345' };

      $.ajax.mockResolvedValue(mockResponse);
      helpers.createShowConfirmationForm = jest.fn();
      helpers.setOrderFormData = jest.fn();

      await paypal.makeExpressPaymentDetailsCall(data);

      expect($.ajax).toHaveBeenCalledTimes(1);
      expect(helpers.createShowConfirmationForm).toHaveBeenCalledWith(
        'https://example.com/show-confirmation',
      );
      expect(helpers.setOrderFormData).toHaveBeenCalledWith(mockResponse);
    });

    it('should stop spinner on error', async () => {
      const stopFn = jest.fn();
      global.$.spinner = jest.fn(() => ({ stop: stopFn }));

      $.ajax.mockRejectedValue(new Error('Network error'));

      await paypal.makeExpressPaymentDetailsCall({});

      expect(stopFn).toHaveBeenCalled();
    });
  });

  describe('onShippingAddressChange', () => {
    it('should update component with shipping methods', async () => {
      const data = {
        shippingAddress: {
          city: 'New York',
          country: 'United States',
          countryCode: 'US',
          state: 'NY',
          postalCode: '10001',
        },
      };
      const actions = { reject: jest.fn() };
      const component = {
        paymentData: 'current-payment-data',
        updatePaymentData: jest.fn(),
      };

      $.ajax.mockResolvedValue({
        paymentData: 'new-payment-data',
        status: 'success',
      });

      await paypal.onShippingAddressChange(data, actions, component);

      expect($.ajax).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).toHaveBeenCalledWith('new-payment-data');
    });

    it('should reject when shipping address is missing', async () => {
      const data = {};
      const actions = { reject: jest.fn() };
      const component = { paymentData: 'payment-data' };

      await paypal.onShippingAddressChange(data, actions, component);

      expect(actions.reject).toHaveBeenCalled();
    });

    it('should reject with ADDRESS_ERROR on exception', async () => {
      const data = {
        shippingAddress: { city: 'New York' },
        errors: { ADDRESS_ERROR: 'Invalid address' },
      };
      const actions = { reject: jest.fn() };
      const component = { paymentData: 'payment-data' };

      $.ajax.mockRejectedValue(new Error('Network error'));

      await paypal.onShippingAddressChange(data, actions, component);

      expect(actions.reject).toHaveBeenCalledWith('Invalid address');
    });
  });

  describe('onShippingOptionsChange', () => {
    it('should update component with selected shipping method', async () => {
      const data = {
        selectedShippingOption: { id: 'standard-shipping' },
      };
      const actions = { reject: jest.fn() };
      const component = {
        paymentData: 'current-payment-data',
        updatePaymentData: jest.fn(),
      };

      $.ajax.mockResolvedValue({
        paymentData: 'new-payment-data',
        status: 'success',
      });

      await paypal.onShippingOptionsChange(data, actions, component);

      expect($.ajax).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).toHaveBeenCalledWith('new-payment-data');
    });

    it('should reject when selectedShippingOption is missing', async () => {
      const data = {};
      const actions = { reject: jest.fn() };
      const component = { paymentData: 'payment-data' };

      await paypal.onShippingOptionsChange(data, actions, component);

      expect(actions.reject).toHaveBeenCalled();
    });

    it('should reject with METHOD_UNAVAILABLE on exception', async () => {
      const data = {
        selectedShippingOption: { id: 'express-shipping' },
        errors: { METHOD_UNAVAILABLE: 'Method not available' },
      };
      const actions = { reject: jest.fn() };
      const component = { paymentData: 'payment-data' };

      $.ajax.mockRejectedValue(new Error('Network error'));

      await paypal.onShippingOptionsChange(data, actions, component);

      expect(actions.reject).toHaveBeenCalledWith('Method not available');
    });
  });

  describe('onAdditionalDetails', () => {
    it('should redirect when userAction is set and response is successful', async () => {
      paypal.userAction = 'continue';
      const state = { data: { paymentData: 'test-data' } };
      const component = { handleError: jest.fn() };

      $.ajax.mockResolvedValue({
        success: true,
        redirectUrl: 'https://example.com/review',
      });

      delete window.location;
      window.location = { href: '' };

      await paypal.onAdditionalDetails(state, component);

      expect($.ajax).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('https://example.com/review');
    });

    it('should submit form when userAction is not set', async () => {
      paypal.userAction = null;
      const state = { data: { paymentData: 'test-data' } };
      const component = { handleError: jest.fn() };

      $.ajax.mockResolvedValue({ orderID: '12345' });
      helpers.createShowConfirmationForm = jest.fn();
      helpers.setOrderFormData = jest.fn();

      const form = document.querySelector('#showConfirmationForm');
      form.submit = jest.fn();

      await paypal.onAdditionalDetails(state, component);

      expect(helpers.createShowConfirmationForm).toHaveBeenCalled();
      expect(helpers.setOrderFormData).toHaveBeenCalled();
      expect(document.querySelector('#additionalDetailsHidden').value).toBe(
        JSON.stringify(state.data),
      );
      expect(form.submit).toHaveBeenCalled();
    });

    it('should handle errors and stop spinner', async () => {
      paypal.userAction = 'continue';
      const state = { data: { paymentData: 'test-data' } };
      const component = { handleError: jest.fn() };
      const error = new Error('Network error');
      const stopFn = jest.fn();
      global.$.spinner = jest.fn(() => ({ stop: stopFn }));

      $.ajax.mockRejectedValue(error);

      await paypal.onAdditionalDetails(state, component);

      expect(component.handleError).toHaveBeenCalledWith(error);
      expect(stopFn).toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return correct configuration without userAction', () => {
      paypal.userAction = null;
      const config = paypal.getConfig();

      expect(config).toEqual({
        configuration: { merchantId: 'test-merchant' },
        showPayButton: true,
        returnUrl: 'https://example.com/return',
        amount: { value: 100, currency: 'USD' },
        isExpress: true,
        onSubmit: expect.any(Function),
        onError: Paypal.onError,
        onAuthorized: expect.any(Function),
        onAdditionalDetails: expect.any(Function),
        onShippingAddressChange: expect.any(Function),
        onShippingOptionsChange: expect.any(Function),
        blockPayPalCreditButton: true,
        blockPayPalPayLaterButton: true,
      });
    });

    it('should include userAction when paypalReviewPageEnabled is true', () => {
      paypal.userAction = 'continue';
      const config = paypal.getConfig();

      expect(config.userAction).toBe('continue');
    });
  });

  describe('getComponent', () => {
    it('should create and return PayPal component', async () => {
      const mockCheckout = {};
      const mockComponent = { mount: jest.fn() };
      const initializeCheckout = require('../initializeCheckout').initializeCheckout;

      initializeCheckout.mockResolvedValue(mockCheckout);
      window.AdyenWeb.createComponent.mockReturnValue(mockComponent);

      await paypal.getComponent();

      expect(window.AdyenWeb.createComponent).toHaveBeenCalledTimes(1);
    });
  });
});
