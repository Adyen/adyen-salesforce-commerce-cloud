const { renderGenericComponent } = require('../renderGenericComponent');
const store = require('../../../../../store');

beforeEach(() => {
  window.AdyenCheckout = jest.fn(() => {});
  window.Configuration = { amount: 0 };
  window.sessionsUrl = "Adyen-Sessions";
});
describe('Render Generic Component', () => {
  it('should call sessions', async () => {
    $.ajax = jest.fn();
    store.componentsObj = { foo: 'bar', bar: 'baz' };
    await renderGenericComponent();
    expect($.ajax).toBeCalledWith({
      url: 'Adyen-Sessions',
      type: 'get',
      success: expect.any(Function),
    });
  });

  it('should render', async () => {
    document.body.innerHTML = `
      <div id="paymentMethodsList"></div>
      <input type="radio" name="brandCode" value="card" />
      <button value="submit-payment">Submit</button>
      <div id="component_card"></div>
      <div id="adyenPosTerminals">
        <span>Child #1</span>
      </div>
      <div>
        <input type="text" id="shippingFirstNamedefault" value="test">
        <input type="text" id="shippingLastNamedefault" value="test">
        <input type="text" id="shippingAddressOnedefault" value="test">
        <input type="text" id="shippingAddressCitydefault" value="test">
        <input type="text" id="shippingZipCodedefault" value="test">
        <input type="text" id="shippingCountrydefault" value="test">
        <input type="text" id="shippingPhoneNumberdefault" value="test">
        <input type="text" id="shippingZipCodedefault" value="test">  
      </div>
    `;
    window.AdyenCheckout = jest.fn(async () => ({
      create: jest.fn(),
      paymentMethodsResponse: {
        storedPaymentMethods: [{ supportedShopperInteractions: ['Ecommerce'] }],
        paymentMethods: [{ type: 'amazonpay' }],
      },
      options: {
        amount: 'mocked_amount',
        countryCode: 'mocked_countrycode',
      }
    }));

    const mockedSuccessResponse = {
      adyenConnectedTerminals: { uniqueTerminalIds: ['mocked_id'] },
      id: 'mock_id',
      sessionData: 'mock_session_data',
      imagePath: 'example.com',
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
