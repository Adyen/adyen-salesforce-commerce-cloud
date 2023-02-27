/**
 * @jest-environment jsdom
 */
const {
  getCardConfig,
  getPaypalConfig,
  getGooglePayConfig,
  getAmazonpayConfig,
  setCheckoutConfiguration,
} = require('../checkoutConfiguration');
const store = require('../../../../../store');

let card;
let paypal;
let paywithgoogle;
let amazonpay;
beforeEach(() => {
  window.Configuration = { environment: 'TEST' };
  store.checkoutConfiguration = {};
  setCheckoutConfiguration()
  card = getCardConfig();
  paypal = getPaypalConfig();
  paywithgoogle = getGooglePayConfig();
  amazonpay = getAmazonpayConfig();
});

describe('Checkout Configuration', () => {
  describe('Card', () => {
    it('handles onChange', () => {
      store.selectedMethod = 'scheme';
      store.componentsObj = { scheme: {} };
      const data = { paymentMethod: { type: 'scheme' } };
      card.onChange({ isValid: true, data });
      expect(store.selectedPayment.isValid).toBeTruthy();
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
  });
  describe('GooglePay', () => {
    it('handles onSubmit', () => {
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
  });

  describe('AmazonPay Fail', () => {
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
});
