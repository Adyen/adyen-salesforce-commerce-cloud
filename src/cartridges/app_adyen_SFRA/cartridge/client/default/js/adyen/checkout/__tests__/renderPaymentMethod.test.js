/**
 * @jest-environment jsdom
 */
const { renderPaymentMethod, renderCheckout } = require('../renderPaymentMethod');
const store = require('../../../../../../config/store');

let mount;
describe('Render Payment Method', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="paymentMethodsList"></ul>
    `;
    store.componentsObj = {
      mocked_id: { node: { mocked_node: { foo: 'bar' } } },
    };

    mount = jest.fn();
    window.AdyenWeb = {
      createComponent: jest.fn(() => ({ mount })),
    }
    store.checkout = {
      create: jest.fn(() => ({ mount })),
    };
  });
  it('should render stored payment method with missing shopper information fields', async () => {
    const paymentMethod = {
      id: 'mocked_id',
      brand: 'mocked_brand',
      name: 'mocked_name',
      lastFour: '1234',
    };
    await renderPaymentMethod(
        paymentMethod,
        true,
        '/mocked_path/',
        'mocked_description',
    );
    expect(mount).toBeCalledTimes(1);
    expect(document.getElementById('paymentMethodsList')).toMatchSnapshot();
    expect(store.componentsObj).toMatchSnapshot();
  });

  it('should render payment method with shopper information fields', async () => {
    document.body.innerHTML += `
    <input id="shippingFirstNamedefault" value="shippingFirstNamedefaultMock" />
      <input id="shippingLastNamedefault" value="shippingLastNamedefaultMock" />
      <input id="shippingPhoneNumberdefault" value="shippingPhoneNumberdefaultMock" />
      <input id="shippingAddressCitydefault" value="shippingAddressCitydefaultMock" />
      <input id="shippingZipCodedefault" value="shippingZipCodedefaultMock" />
      <input id="shippingCountrydefault" value="shippingCountrydefaultMock" />
      <input id="shippingStatedefault" value="shippingStatedefaultMock" />
      <input id="shippingAddressOnedefault" value="shippingAddressOnedefaultMock" />
      <input id="shippingAddressTwodefault" value="shippingAddressTwodefaultMock" />
            
      <input id="billingAddressCity" value="billingAddressCityMock" />
      <input id="billingZipCode" value="billingZipCodeMock" />
      <input id="billingCountry" value="billingCountryMock" />
      <input id="billingState" value="billingStateMock" />
      <input id="billingAddressOne" value="billingAddressOneMock" />
      <input id="billingAddressTwo" value="billingAddressTwoMock" />
      
      <span class="customer-summary-email">test@user.com</span>
    `
    const paymentMethod = {
      type: 'scheme',
      name: 'mocked_name',
      lastFour: '1234',
    };
    await renderPaymentMethod(
        paymentMethod,
        false,
        '/mocked_path/',
        'mocked_description',
    );
    expect(document.getElementById('paymentMethodsList')).toMatchSnapshot();
    expect(store.componentsObj).toMatchSnapshot();
  });

  it('should handle input onChange for paypal', async () => {
    document.body.innerHTML += `
      <button value="submit-payment"></button>
      <div id="component_paypal"></div>
    `;
    const paymentMethod = {
      type: 'paypal',
      name: 'mocked_name',
      lastFour: '1234',
    };
    await renderPaymentMethod(
        paymentMethod,
        false,
        '/mocked_path/',
        'mocked_description',
    );
    const input = document.getElementById('rb_paypal');
    input.onchange({ target: { value: 'paypal' } });
    expect(
        document.querySelector('button[value="submit-payment"]').disabled,
    ).toBeTruthy();
    expect(store.selectedMethod).toBe('paypal');
  });
});

describe('Render Checkout', () => {
  // Apple Pay and Google Pay are the only components with an asynchronous
  // isAvailable, so they are the ones that used to be pushed to the bottom
  const SLOW_METHODS = ['applepay', 'googlepay'];

  const paymentMethodsResponse = {
    locale: 'en_US',
    imagePath: '/mocked_path/',
    adyenDescriptions: {},
    adyenPaymentMethodTitles: { en_US: {} },
    AdyenPaymentMethods: {
      storedPaymentMethods: [],
      paymentMethods: [
        { type: 'cashapp', name: 'Cash App Pay' },
        { type: 'paypal', name: 'PayPal' },
        { type: 'applepay', name: 'Apple Pay' },
        { type: 'giftcard', brand: 'genericgiftcard', name: 'Generic GiftCard' },
        { type: 'giftcard', brand: 'givex', name: 'Givex' },
        { type: 'googlepay', name: 'Google Pay' },
        { type: 'scheme', name: 'Cards' },
        { type: 'klarna_account', name: 'Pay over time with Klarna.' },
        { type: 'affirm', name: 'Affirm' },
      ],
    },
  };

  const getRenderedOrder = () =>
    Array.from(
      document.querySelectorAll('#paymentMethodsList input[name="brandCode"]'),
    ).map((input) => input.value);

  const mockCreateComponent = (availability = {}) =>
    jest.fn((type) => {
      const node = { mount: jest.fn() };
      if (SLOW_METHODS.includes(type)) {
        node.isAvailable = () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(availability[type] !== false), 10);
          });
      }
      return node;
    });

  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="paymentMethodsList"></ul>
    `;
    store.componentsObj = {};
    store.paymentMethodsConfiguration = {};
    store.checkout = {};
  });

  it('should render the payment methods in the order of the response', async () => {
    window.AdyenWeb = { createComponent: mockCreateComponent() };

    await renderCheckout(paymentMethodsResponse);

    expect(getRenderedOrder()).toEqual([
      'cashapp',
      'paypal',
      'applepay',
      'googlepay',
      'scheme',
      'klarna_account',
      'affirm',
    ]);
  });

  it('should not leave a hidden list item for an unavailable payment method', async () => {
    window.AdyenWeb = {
      createComponent: mockCreateComponent({ applepay: false }),
    };

    await renderCheckout(paymentMethodsResponse);

    expect(getRenderedOrder()).toEqual([
      'cashapp',
      'paypal',
      'googlepay',
      'scheme',
      'klarna_account',
      'affirm',
    ]);
    expect(
      Array.from(document.querySelectorAll('#paymentMethodsList li')).filter(
        (li) => li.style.display === 'none',
      ),
    ).toHaveLength(0);
    expect(store.componentsObj.applepay).toBeUndefined();
  });
});
