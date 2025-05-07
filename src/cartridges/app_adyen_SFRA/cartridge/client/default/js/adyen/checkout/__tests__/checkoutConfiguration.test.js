/**
 * @jest-environment jsdom
 */
const store = require('../../../../../../config/store');
const helpers = require('../helpers');
const httpClient = require('../../commons/httpClient');
const {
  setCheckoutConfiguration,
} = require('../checkoutConfiguration');
const KlarnaConfig = require("../paymentMethodsConfiguration/klarna/klarnaConfig");
const GooglePayConfig = require("../paymentMethodsConfiguration/googlePay/googlePayConfig");
const GiftCardsConfig = require("../paymentMethodsConfiguration/giftcards/giftcardsConfig");

let card;
let paypal;
let paywithgoogle;
let amazonpay;
let giftcardconfig;
let cashapp;
let applepay;
let klarna;
let querySelector;

jest.mock('../../commons/httpClient', () => ({
  httpClient: jest.fn().mockImplementation(() => ({
    balance: 100,
      resultCode: 'invalid'
  }))
}))

beforeEach(async () => {
  jest.clearAllMocks();
  querySelector = document.querySelector;
  window.Configuration = { environment: 'TEST' };
  window.klarnaWidgetEnabled = true;
  window.merchantAccount = 'test_merchant';
  window.customerEmail = 'test@email.com';
  window.AdyenWeb = {
    AdyenCheckout: jest.fn(async () => ({
      create: jest.fn(),
      paymentMethodsResponse: {
        storedPaymentMethods: [{ supportedShopperInteractions: ['Ecommerce'] }],
        paymentMethods: [{ type: 'amazonpay' }],
        adyenDescriptions: {
          amazonpay: 'testDescription'
        }
      },
    }))
  };
  store.checkoutConfiguration = {};
  const amount = { value: 150, currency: 'USD' };
  await setCheckoutConfiguration({email: window.customerEmail, paymentMethodsResponse: { amount }});
  card = store.paymentMethodsConfiguration.scheme
  paypal = store.paymentMethodsConfiguration.paypal
  amazonpay = store.paymentMethodsConfiguration.amazonpay
  cashapp = store.paymentMethodsConfiguration.cashapp
  applepay = store.paymentMethodsConfiguration.applepay
});

describe('Checkout Configuration', () => {
  describe('Card', () => {
    it('handles onChange', () => {
      store.selectedMethod = 'scheme';
      store.componentsObj = { scheme: {} };
      const data = { paymentMethod: { type: 'scheme' } };
      card.onChange({ isValid: true, data }, { props: { holderName: 'test' } });
      expect(store.selectedPayment.isValid).toBeTruthy();
      // expect(card.clickToPayConfiguration.shopperEmail).toBe(window.customerEmail);
      // expect(card.clickToPayConfiguration.merchantDisplayName).toBe(window.merchantAccount);
    });

    it('handles onFieldValid', () => {
      const mockedInput = "<input id='cardNumber' />";
      document.body.innerHTML = mockedInput;

      card.onFieldValid({ endDigits: 4444 });
      const cardNumber = document.querySelector('#cardNumber');
      expect(cardNumber.value).toEqual('************4444');
    });

    it('handles onBrand', () => {
      const mockedInput = "<input id='cardType' />";
      document.body.innerHTML = mockedInput;

      card.onBrand({ brand: 'visa' });
      const cardType = document.querySelector('#cardType');
      expect(cardType.value).toEqual('visa');
    });

    it('handles onSubmit', () => {
      document.body.innerHTML = `
        <div id="lb_scheme">Cards</div>
        <div id="adyenPaymentMethodName"></div>
        <button value="submit-payment"></button>
      `;
      const spy = jest.fn();
      const submitButton = document.querySelector(
        'button[value="submit-payment"]',
      );
      submitButton.addEventListener('click', () => {
        spy();
      });
      store.selectedMethod = 'scheme';
      card.onSubmit({ data: {} });
      expect(spy).toBeCalledTimes(1);
      expect(submitButton.disabled).toBeFalsy();
    });
  });
  describe('PayPal', () => {
    it('handles onSubmit', () => {
      document.body.innerHTML = `
        <div id="lb_paypal">PayPal</div>
        <div id="adyenPaymentMethodName"></div>
        <div id="adyenStateData"></div>
      `;
      store.selectedMethod = 'paypal';
      store.componentsObj = { paypal: { stateData: { foo: 'bar' } } };
      paypal.onSubmit({ data: {} });
      expect(document.getElementById('adyenStateData').value).toBe(
        JSON.stringify(store.selectedPayment.stateData),
      );
    });

    it('handles onError', () => {
      document.body.innerHTML = `
        <div id="showConfirmationForm"></div>
      `;
      document.querySelector = jest.fn();
      document.querySelector.mockReturnValue({
        value: '',
        submit: jest.fn(),
      });
      store.paypalTerminatedEarly = true;
      const error = new Error('Test error'); 
      const component = { setStatus: jest.fn() }; 
      paypal.onError(error, component);
      expect(store.paypalTerminatedEarly).toBe(false);
      expect(component.setStatus).toBeCalledWith('ready');
      expect(document.querySelector('#showConfirmationForm').submit).toBeCalled();
      document.querySelector = querySelector;
    });

    it('handles onClick when paypalTerminatedEarly is set to true', () => {
      document.body.innerHTML = `
        <div id="lb_paypal">PayPal</div>
        <div id="adyenPaymentMethodName"></div>
        <div id="merchantReference"></div>
      `;
      store.selectedMethod = 'paypal';
      store.paypalTerminatedEarly = true;
      const actions = { resolve: jest.fn() };
      paypal.onClick({}, actions);
      expect(actions.resolve).toBeCalledTimes(1);
    });

    it('handles onClick fail', () => {
      document.body.innerHTML = `
      <div id="lb_paypal">PayPal</div>
      <div id="adyenPaymentMethodName"></div>
      <div id="adyenStateData"></div>
      `;
      store.selectedMethod = 'paypal';
      store.formErrorsExist = true;
      store.componentsObj = { paypal: { stateData: { foo: 'bar' } } };
      const actions = { resolve: jest.fn(), reject: jest.fn() };
      paypal.onClick({}, actions);
      expect(actions.resolve).toBeCalledTimes(0);
      expect(actions.reject).toBeCalledTimes(1);
    });

    it('handles onAdditionalDetails', () => {
      document.body.innerHTML = `
        <div id="lb_paypal">PayPal</div>
        <div id="additionalDetailsHidden"></div>
        <div id="showConfirmationForm"></div>
      `;
      document.querySelector = jest.fn();
      document.querySelector.mockReturnValue({
        value: '',
        submit: jest.fn(),
      });
      store.selectedMethod = 'paypal';
      paypal.onAdditionalDetails({});
      expect(document.querySelector).toHaveBeenCalledWith('#additionalDetailsHidden');
      expect(document.querySelector).toHaveBeenCalledWith('#showConfirmationForm');
      document.querySelector = querySelector;
    });
  });

  describe('GooglePay', () => {
    it('handles onSubmit', () => {
      paywithgoogle = new GooglePayConfig(helpers)
      document.body.innerHTML = `
        <div id="lb_paywithgoogle">Google Pay</div>
        <div id="adyenPaymentMethodName"></div>
        <button value="submit-payment"></button>
      `;
      const spy = jest.fn();
      const submitButton = document.querySelector(
        'button[value="submit-payment"]',
      );
      submitButton.addEventListener('click', () => {
        spy();
      });
      store.selectedMethod = 'paywithgoogle';
      paywithgoogle.onSubmit({ data: {} });
      expect(spy).toBeCalledTimes(1);
      expect(submitButton.disabled).toBeFalsy();
    });
  });

  describe('AmazonPay', () => {
    it('handles onClick success', () => {
      document.body.innerHTML = `
        <div id="lb_amazonpay">AmazonPay</div>
        <div id="adyenPaymentMethodName"></div>
        <div id="adyenStateData"></div>
      `;
      store.selectedMethod = 'amazonpay';
      store.formErrorsExist = false;
      store.componentsObj = { amazonpay: { stateData: { foo: 'bar' } } };
      const resolve = jest.fn();
      const reject = jest.fn();
      amazonpay.onClick(resolve, reject);
      expect(resolve).toBeCalledTimes(1);
      expect(reject).toBeCalledTimes(0);
    });

    it('handles onClick fail', () => {
      document.body.innerHTML = `
        <div id="lb_amazonpay">AmazonPay</div>
        <div id="adyenPaymentMethodName"></div>
        <div id="adyenStateData"></div>
      `;
      store.selectedMethod = 'amazonpay';
      store.formErrorsExist = true;
      store.componentsObj = { amazonpay: { stateData: { foo: 'bar' } } };
      const resolve = jest.fn();
      const reject = jest.fn();
      amazonpay.onClick(resolve, reject);
      expect(resolve).toBeCalledTimes(0);
      expect(reject).toBeCalledTimes(1);
    });
  });

  describe('ApplePay', () => {
    it('handles onSubmit', () => {
      document.body.innerHTML = `
        <div id="lb_applepay">ApplePay</div>
        <div id="adyenPaymentMethodName"></div>
        <div id="adyenStateData"></div>
      `;
      store.selectedMethod = 'applepay';
      store.componentsObj = { applepay: { stateData: { foo: 'bar' }  } };
      applepay.onSubmit({ data: {} });
      expect(document.getElementById('adyenPaymentMethodName').value).toBe('ApplePay');
    });
  });

  describe('CashApp', () => {
    it('handles onSubmit', () => {
      document.body.innerHTML = `
        <div id="lb_cashapp">CashApp</div>
        <div id="adyenPaymentMethodName"></div>
        <button value="submit-payment"></button>
      `;
      store.selectedMethod = 'cashapp';
      store.componentsObj = { cashapp: { stateData: { foo: 'bar' } } };
      cashapp.onSubmit({ data: {} });
      expect(document.getElementById('adyenPaymentMethodName').value).toBe('CashApp');
    });
  });

  describe('Giftcards', () => {
    it('should update selected payment on change with valid state', () => {
      store.updateSelectedPayment = jest.fn();
      giftcardconfig = new GiftCardsConfig(store, httpClient).getConfig();
      giftcardconfig.onChange({ isValid: true, data: 'testData' });
      expect(store.updateSelectedPayment).toHaveBeenCalledWith("giftcard", "isValid", true);
      expect(store.updateSelectedPayment).toHaveBeenCalledWith(
        'giftcard',
        'stateData',
        'testData'
      );
    });

  it('should call onBalanceCheck and resolve with valid data', async () => {
    document.body.innerHTML = `
    <button value="submit-payment" disabled></button>
    <div id="cancelGiftCardButton"></div>
    <div id="giftCardsInfoMessage"></div>
  `;
    store.partialPaymentsOrderObj = {};
    const mockResolve = jest.fn();
    const mockReject = jest.fn();
    const requestData = {resultCode: 'success', remainingAmountFormatted: 50, totalAmountFormatted: 100};
    store.checkout = {
      options: {}
     };
    jest.spyOn($, 'ajax').mockReturnValue({ balance: 100, resultCode: 'Success'});
    const httpClient = jest.fn().mockReturnValue({balance: 100, resultCode: 'Success'});
    giftcardconfig = new GiftCardsConfig(store, httpClient).getConfig();
    await giftcardconfig.onBalanceCheck(mockResolve, mockReject, requestData);
    expect(mockResolve).toHaveBeenCalled();
    expect(mockReject).not.toHaveBeenCalled();
  });

  it('should call onBalanceCheck and reject with invalid result code', async () => {
    document.body.innerHTML = `
    <button value="submit-payment" disabled></button>
    <div id="cancelGiftCardButton"></div>
  `;
    store.partialPaymentsOrderObj = {};
    const mockResolve = jest.fn();
    const mockReject = jest.fn();
    const requestData = {resultCode: 'invalid', remainingAmountFormatted: 50, totalAmountFormatted: 100};
    jest.spyOn($, 'ajax').mockReturnValue({ balance: 100, resultCode: 'Error'});
    await giftcardconfig.onBalanceCheck(mockResolve, mockReject, requestData);
    expect(mockReject).toHaveBeenCalled();
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it('should handle onSubmit correctly', () => {
    document.body.innerHTML = `
      <input name="brandCode">
      <button value="submit-payment" disabled></button>
    `;
    const spy = jest.fn();
    const submitButton = document.querySelector(
      'button[value="submit-payment"]',
    );
    submitButton.addEventListener('click', () => {
      spy();
    });
    const stateData = {
      data: {
        paymentMethod: {
          type: 'giftcard',
        },
      },
    };
    const config = giftcardconfig;
    config.onSubmit(stateData, {});
    expect(document.querySelector('input[name="brandCode"]').checked).toBeFalsy();
    expect(document.querySelector('button[value="submit-payment"]').disabled).toBeFalsy();
    expect(spy).toBeCalledTimes(1);
  });

  it('should make gift card payment request on successful order request', () => {
  });

  it('should reject gift card payment request onOrderRequest if partialPaymentResponse contains error', () => {
  });

  it('should make payments call including giftcard data and order data', () => {
  })
});

describe('Klarna', () => {
  it('handles onSubmit', () => {
    klarna = new KlarnaConfig(helpers, window.klarnaWidgetEnabled).getConfig();
    document.body.innerHTML = `
      <div id="lb_klarna">Klarna</div>
      <div id="adyenPaymentMethodName"></div>
      <div id="adyenStateData"></div>
    `;
    store.selectedMethod = 'klarna';
    store.componentsObj = { klarna: { stateData: { foo: 'bar' }  } };
    klarna.onSubmit({ data: {} });
    expect(document.getElementById('adyenPaymentMethodName').value).toBe('Klarna');
  });

  it('handles onAdditionalDetails', () => {
    klarna = new KlarnaConfig(helpers, window.klarnaWidgetEnabled).getConfig();
    document.body.innerHTML = `
      <div id="additionalDetailsHidden"></div>
      <div id="showConfirmationForm"></div>
    `;
    document.querySelector = jest.fn();
    document.querySelector.mockReturnValue({
      value: '',
      submit: jest.fn(),
    });
    store.selectedMethod = 'klarna';
    klarna.onAdditionalDetails({});
    expect(document.querySelector).toHaveBeenCalledWith('#additionalDetailsHidden');
    expect(document.querySelector).toHaveBeenCalledWith('#showConfirmationForm');
    document.querySelector = querySelector;
  });
});
});
