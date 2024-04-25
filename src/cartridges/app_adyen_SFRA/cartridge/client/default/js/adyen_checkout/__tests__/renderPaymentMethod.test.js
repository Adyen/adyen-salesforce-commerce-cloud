/**
 * @jest-environment jsdom
 */
const { renderPaymentMethod } = require('../renderPaymentMethod');
const store = require('../../../../../store');

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

  it('should render payment method with shopper information fields', () => {
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
    renderPaymentMethod(
        paymentMethod,
        false,
        '/mocked_path/',
        'mocked_description',
    );
    expect(document.getElementById('paymentMethodsList')).toMatchSnapshot();
    expect(store.componentsObj).toMatchSnapshot();
    expect(store.checkout.create.mock.calls[0][1]).toEqual({
      data: {
        personalDetails: {
          firstName: 'shippingFirstNamedefaultMock',
          lastName: 'shippingLastNamedefaultMock',
          telephoneNumber: 'shippingPhoneNumberdefaultMock',
          shopperEmail: 'test@user.com',
        },
        firstName: 'shippingFirstNamedefaultMock',
        lastName: 'shippingLastNamedefaultMock',
        telephoneNumber: 'shippingPhoneNumberdefaultMock',
        shopperEmail: 'test@user.com',
      },
      visibility: {
        personalDetails: 'editable',
        billingAddress: 'hidden',
        deliveryAddress: 'hidden',
      },
    });
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
