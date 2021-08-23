const { renderGenericComponent } = require('../renderGenericComponent');
const store = require('../../../../../store');

beforeEach(() => {
  window.AdyenCheckout = jest.fn();
  window.Configuration = { amount: 0 };
  window.getPaymentMethodsURL = "Adyen-GetPaymentMethods";
  document.body.innerHTML = `
      <input id="shippingFirstNamedefault" value="shippingFirstNamedefaultMock" />
      <input id="shippingLastNamedefault" value="shippingLastNamedefaultMock" />
      <input id="shippingPhoneNumberdefault" value="shippingPhoneNumberdefaultMock" />
      <input id="billingAddressCity" value="billingAddressCityMock" />
      <input id="billingZipCode" value="billingZipCodeMock" />
      <input id="billingCountry" value="billingCountryMock" />
      <ul id="paymentMethodsList"></ul>
      <input type="radio" name="brandCode" value="card" />
      <button value="submit-payment">Submit</button>
      <div id="component_card"></div>
      <div id="adyenPosTerminals">
        <span>Child #1</span>
    `;
});
describe('Render Generic Component', () => {
  it('should call getPaymentMethods', async () => {
    $.ajax = jest.fn();
    store.componentsObj = { foo: 'bar', bar: 'baz' };
    await renderGenericComponent();
    expect($.ajax).toBeCalledWith({
      url: 'Adyen-GetPaymentMethods',
      type: 'get',
      success: expect.any(Function),
    });
  });
  it('should render', async () => {
    window.AdyenCheckout = jest.fn(() => ({
      create: jest.fn(),
      paymentMethodsResponse: {
        storedPaymentMethods: [{ supportedShopperInteractions: ['Ecommerce'] }],
      },
    }));

    const mockedSuccessResponse = {
      amount: 'mocked_amount',
      countryCode: 'mocked_country',
      AdyenConnectedTerminals: { uniqueTerminalIds: ['mocked_id'] },
      AdyenPaymentMethods: {
        paymentMethods: [{ type: 'scheme', name: 'Card' }, {type: 'amazonpay'}],
        storedPaymentMethods: true,
      },
      ImagePath: 'example.com',
      AdyenDescriptions: [{ description: 'mocked_description' }, { description: 'mocked_description2' }],
    };

    $.ajax = jest.fn(({ success }) => success(mockedSuccessResponse));
    store.componentsObj = { foo: 'bar', bar: 'baz' };
    store.checkoutConfiguration.paymentMethodsConfiguration = {amazonpay: {}};
    await renderGenericComponent();
    expect(store.checkoutConfiguration).toMatchSnapshot();
    expect(
      document.querySelector('input[type=radio][name=brandCode]').value,
    ).toBeTruthy();
  });
});
