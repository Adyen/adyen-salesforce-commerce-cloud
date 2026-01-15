/**
 * @jest-environment ./jest/customJsdomEnvironment.js
 */

// Mock httpClient before any imports - it's a named export
const mockHttpClient = jest.fn();
jest.mock('../../../commons/httpClient', () => ({
  httpClient: mockHttpClient,
}));

// Mock payment method classes
jest.mock('../../paymentMethods/index', () => ({
  Paypal: jest.fn(),
  ApplePay: jest.fn(),
  GooglePay: jest.fn(),
}));

// Mock store
jest.mock('../../../../../../../config/store', () => ({
  paymentMethodsResponse: null,
}));

const { Paypal, ApplePay, GooglePay } = require('../../paymentMethods/index');
const store = require('../../../../../../../config/store');
const expressPayments = require('../expressPayments');

describe('Shipping Express Payments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    $('body').off();
    
    document.body.innerHTML = `
      <div id="checkout-main">
        <div class="single-shipping">
          <div class="shipping-method-list"></div>
        </div>
      </div>
    `;
    
    window.areExpressPaymentsEnabledOnShipping = 'true';
    window.getExpressPaymentMethodsURL = 'https://example.com/express-methods';

    // Reset mocks
    Paypal.mockClear();
    ApplePay.mockClear();
    GooglePay.mockClear();
    mockHttpClient.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
    $('body').off(); 
    delete window.areExpressPaymentsEnabledOnShipping;
    delete window.getExpressPaymentMethodsURL;
  });

  describe('ensureExpressContainer', () => {
    it('should return existing container if present', async () => {
      const existingContainer = document.createElement('div');
      existingContainer.id = 'express-container';
      existingContainer.textContent = 'existing';
      document.body.appendChild(existingContainer);

      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: ['paypal'],
      });

      await expressPayments.init();
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const container = document.getElementById('express-container');
      expect(container).toBe(existingContainer);
    });

    it('should create container and prepend to .shipping-method-list', async () => {
      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: [],
      });

      await expressPayments.init();
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const container = document.getElementById('express-container');
      const shippingMethodList = document.querySelector('.shipping-method-list');
      
      expect(container).toBeTruthy();
      expect(shippingMethodList.firstChild).toBe(container);
    });

    it('should fallback to .single-shipping when .shipping-method-list not found', async () => {
      document.body.innerHTML = `
        <div id="checkout-main">
          <div class="single-shipping"></div>
        </div>
      `;

      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: [],
      });

      await expressPayments.init();
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const container = document.getElementById('express-container');
      const singleShipping = document.querySelector('.single-shipping');
      
      expect(container).toBeTruthy();
      expect(singleShipping.firstChild).toBe(container);
    });

    it('should fallback to #checkout-main when .single-shipping not found', async () => {
      document.body.innerHTML = `<div id="checkout-main"></div>`;

      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: [],
      });

      await expressPayments.init();
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const container = document.getElementById('express-container');
      const checkoutMain = document.querySelector('#checkout-main');
      
      expect(container).toBeTruthy();
      expect(checkoutMain.firstChild).toBe(container);
    });

    it('should fallback to body when no checkout containers found', async () => {
      document.body.innerHTML = `<div></div>`;

      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: [],
      });

      await expressPayments.init();
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const container = document.getElementById('express-container');
      
      expect(container).toBeTruthy();
      expect(document.body.firstChild).toBe(container);
    });
  });

  describe('getExpressPaymentButtons', () => {
    it('should return empty array when shippingExpressMethods is undefined', async () => {
      mockHttpClient.mockResolvedValue({});

      await expressPayments.init();
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const container = document.getElementById('express-container');
      expect(container.children.length).toBe(0);
    });

    it('should return empty array when shippingExpressMethods is empty', async () => {
      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: [],
      });

      await expressPayments.init();
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const container = document.getElementById('express-container');
      expect(container.children.length).toBe(0);
    });

    it('should create button containers with correct attributes', async () => {
      Paypal.mockImplementation(() => ({
        getComponent: jest.fn().mockResolvedValue({ mount: jest.fn() }),
      }));

      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: ['paypal'],
        AdyenPaymentMethods: {
          paymentMethods: [{ type: 'paypal', configuration: {} }],
        },
        applicationInfo: {},
        adyenTranslations: {},
      });

      await expressPayments.init();
      
      await new Promise(resolve => setTimeout(resolve, 0));

      const paypalContainer = document.getElementById('paypal-container');
      expect(paypalContainer).toBeTruthy();
      expect(paypalContainer.getAttribute('class')).toBe('expressComponent paypal');
      expect(paypalContainer.getAttribute('data-method')).toBe('paypal');
      expect(paypalContainer.getAttribute('style')).toBe('padding:0');
    });

    it('should create multiple button containers', async () => {
      Paypal.mockImplementation(() => ({
        getComponent: jest.fn().mockResolvedValue({ mount: jest.fn() }),
      }));
      ApplePay.mockImplementation(() => ({
        getComponent: jest.fn().mockResolvedValue({ mount: jest.fn() }),
      }));
      GooglePay.mockImplementation(() => ({
        getComponent: jest.fn().mockResolvedValue({ mount: jest.fn() }),
      }));

      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: ['paypal', 'applepay', 'googlepay'],
        AdyenPaymentMethods: {
          paymentMethods: [
            { type: 'paypal', configuration: {} },
            { type: 'applepay', configuration: {} },
            { type: 'googlepay', configuration: {} },
          ],
        },
        applicationInfo: {},
        adyenTranslations: {},
      });

      await expressPayments.init();
      
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(document.getElementById('paypal-container')).toBeTruthy();
      expect(document.getElementById('applepay-container')).toBeTruthy();
      expect(document.getElementById('googlepay-container')).toBeTruthy();
    });
  });

  describe('registerRenderers', () => {
    it('should register all event handlers on init', async () => {
      const onSpy = jest.spyOn($.fn, 'on');

      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: [],
      });

      await expressPayments.init();

      expect(onSpy).toHaveBeenCalledWith(
        'shipping:renderpaypalButton',
        expect.any(Function)
      );
      expect(onSpy).toHaveBeenCalledWith(
        'shipping:renderapplepayButton',
        expect.any(Function)
      );
      expect(onSpy).toHaveBeenCalledWith(
        'shipping:rendergooglepayButton',
        expect.any(Function)
      );
      expect(onSpy).toHaveBeenCalledWith(
        'shipping:renderExpressPaymentContainer',
        expect.any(Function)
      );
    });
  });

  describe('init', () => {
    it('should not initialize when disabled', async () => {
      window.areExpressPaymentsEnabledOnShipping = 'false';

      await expressPayments.init();

      expect(mockHttpClient).not.toHaveBeenCalled();
    });

    it('should not initialize when URL is missing', async () => {
      window.getExpressPaymentMethodsURL = undefined;

      await expressPayments.init();

      expect(mockHttpClient).not.toHaveBeenCalled();
    });

    it('should fetch payment methods when enabled', async () => {
      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: [],
      });

      await expressPayments.init();

      expect(mockHttpClient).toHaveBeenCalled();
    });

    it('should store payment methods in store', async () => {
      const mockResponse = {
        shippingExpressMethods: ['paypal'],
        AdyenPaymentMethods: {},
      };
      mockHttpClient.mockResolvedValue(mockResponse);

      await expressPayments.init();

      expect(store.paymentMethodsResponse).toEqual(mockResponse);
    });

    it('should register checkout:updateCheckoutView listener', async () => {
      mockHttpClient.mockResolvedValue({
        shippingExpressMethods: [],
      });

      const onSpy = jest.spyOn($.fn, 'on');

      await expressPayments.init();

      expect(onSpy).toHaveBeenCalledWith(
        'checkout:updateCheckoutView',
        expect.any(Function)
      );
    });
  });
}); 
