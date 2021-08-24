const {
  getCardConfig,
  getPaypalConfig,
  getGooglePayConfig,
  getMbwayConfig,
  getQRCodeConfig,
  setCheckoutConfiguration,
} = require('../checkoutConfiguration');
const store = require('../../../../../store');

let card;
let paypal;
let paywithgoogle;
let mbway;
let swish;
beforeEach(() => {
  window.Configuration = { environment: 'TEST' };
  store.checkoutConfiguration = {};
  card = getCardConfig();
  paypal = getPaypalConfig();
  paywithgoogle = getGooglePayConfig();
  mbway = getMbwayConfig();
  swish = getQRCodeConfig();
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
  describe('MB Way', () => {
    it('handles onSubmit', () => {
      document.body.innerHTML = `
        <div id="lb_mbway">MB Way</div>
        <div id="adyenPaymentMethodName"></div>
        <div id="adyenStateData"></div>
      `;
      store.selectedMethod = 'mbway';
      store.componentsObj = { mbway: { stateData: { foo: 'bar' } } };
      mbway.onSubmit({ data: {} });
      expect(document.getElementById('adyenStateData').value).toBe(
          JSON.stringify(store.selectedPayment.stateData),
      );
    });
  });
  describe('QR code (swish)', () => {
    it('handles onSubmit', () => {
      document.body.innerHTML = `
        <div id="lb_swish">swish</div>
        <div id="adyenPaymentMethodName"></div>
        <div id="adyenStateData"></div>
      `;
      store.selectedMethod = 'swish';
      store.componentsObj = { swish: { stateData: { foo: 'bar' } } };
      swish.onSubmit({ data: {} });
      expect(document.getElementById('adyenStateData').value).toBe(
          JSON.stringify(store.selectedPayment.stateData),
      );
    });
  });

  describe('personalDetails', () => {
    it('should enrich payment methods with personal details', () => {
      document.body.innerHTML = `
      <input id="shippingFirstNamedefault" value="shippingFirstNamedefaultMock" />
      <input id="shippingLastNamedefault" value="shippingLastNamedefaultMock" />
      <input id="shippingPhoneNumberdefault" value="shippingPhoneNumberdefaultMock" />
      <input id="shippingAddressCitydefault" value="shippingAddressCitydefaultMock" />
      <input id="shippingZipCodedefault" value="shippingZipCodedefaultMock" />
      <input id="shippingCountrydefault" value="shippingCountrydefaultMock" />
      
      <input id="billingAddressCity" value="billingAddressCityMock" />
      <input id="billingZipCode" value="billingZipCodeMock" />
      <input id="billingCountry" value="billingCountryMock" />
      <span class="customer-summary-email">test@user.com</span>
    `;

      setCheckoutConfiguration()
      for(const paymentMethodConfiguration of Object.values(store.checkoutConfiguration.paymentMethodsConfiguration)) {
        expect(paymentMethodConfiguration.data.firstName).toBe('shippingFirstNamedefaultMock');
        expect(paymentMethodConfiguration.data.lastName).toBe('shippingLastNamedefaultMock');
        expect(paymentMethodConfiguration.data.telephoneNumber).toBe('shippingPhoneNumberdefaultMock');
        expect(paymentMethodConfiguration.data.shopperEmail).toBe('test@user.com');

        expect(paymentMethodConfiguration.data.billingAddress.city).toBe('billingAddressCityMock');
        expect(paymentMethodConfiguration.data.billingAddress.postalCode).toBe('billingZipCodeMock');
        expect(paymentMethodConfiguration.data.billingAddress.country).toBe('billingCountryMock');

        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.city).toBe('shippingAddressCitydefaultMock');
        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.postalCode).toBe('shippingZipCodedefaultMock');
        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.country).toBe('shippingCountrydefaultMock');

        expect(paymentMethodConfiguration.data.personalDetails.firstName).toBe('shippingFirstNamedefaultMock');
        expect(paymentMethodConfiguration.data.personalDetails.lastName).toBe('shippingLastNamedefaultMock');
        expect(paymentMethodConfiguration.data.personalDetails.telephoneNumber).toBe('shippingPhoneNumberdefaultMock');
        expect(paymentMethodConfiguration.data.personalDetails.shopperEmail).toBe('test@user.com');

        expect(paymentMethodConfiguration.data.personalDetails.billingAddress.city).toBe('billingAddressCityMock');
        expect(paymentMethodConfiguration.data.personalDetails.billingAddress.postalCode).toBe('billingZipCodeMock');
        expect(paymentMethodConfiguration.data.personalDetails.billingAddress.country).toBe('billingCountryMock');

        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.city).toBe('shippingAddressCitydefaultMock');
        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.postalCode).toBe('shippingZipCodedefaultMock');
        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.country).toBe('shippingCountrydefaultMock');
      }
    })

    it('should not fail when fields are missing', () => {
      document.body.innerHTML = '';
      setCheckoutConfiguration();
      for(const paymentMethodConfiguration of Object.values(store.checkoutConfiguration.paymentMethodsConfiguration)) {
        expect(paymentMethodConfiguration.data.firstName).toBeUndefined();
        expect(paymentMethodConfiguration.data.lastName).toBeUndefined();
        expect(paymentMethodConfiguration.data.telephoneNumber).toBeUndefined();
        expect(paymentMethodConfiguration.data.shopperEmail).toBeUndefined();

        expect(paymentMethodConfiguration.data.billingAddress.city).toBeUndefined();
        expect(paymentMethodConfiguration.data.billingAddress.postalCode).toBeUndefined();
        expect(paymentMethodConfiguration.data.billingAddress.country).toBeUndefined();

        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.city).toBeUndefined();
        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.postalCode).toBeUndefined();
        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.country).toBeUndefined();

        expect(paymentMethodConfiguration.data.personalDetails.firstName).toBeUndefined();
        expect(paymentMethodConfiguration.data.personalDetails.lastName).toBeUndefined();
        expect(paymentMethodConfiguration.data.personalDetails.telephoneNumber).toBeUndefined();
        expect(paymentMethodConfiguration.data.personalDetails.shopperEmail).toBeUndefined();

        expect(paymentMethodConfiguration.data.personalDetails.billingAddress.city).toBeUndefined();
        expect(paymentMethodConfiguration.data.personalDetails.billingAddress.postalCode).toBeUndefined();
        expect(paymentMethodConfiguration.data.personalDetails.billingAddress.country).toBeUndefined();

        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.city).toBeUndefined();
        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.postalCode).toBeUndefined();
        expect(paymentMethodConfiguration.data.personalDetails.deliveryAddress.country).toBeUndefined();
      }
    })
  })
});
