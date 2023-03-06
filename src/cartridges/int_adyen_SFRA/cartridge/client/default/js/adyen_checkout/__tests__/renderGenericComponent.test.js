/**
 * @jest-environment jsdom
 */
const { renderGenericComponent } = require('../renderGenericComponent');
const { createSession } = require('../../commons');
const { fetchGiftCards } = require('../../commons');
const store = require('../../../../../store');

jest.mock('../../commons');
jest.mock('../../../../../store');

beforeEach(() => {
  window.AdyenCheckout = jest.fn(async () => ({
    create: jest.fn(),
    paymentMethodsResponse: {
      storedPaymentMethods: [{ supportedShopperInteractions: ['Ecommerce'] }],
      paymentMethods: [{ type: 'amazonpay' }],
    },
    options: {
      amount: 'mocked_amount',
      countryCode: 'mocked_countrycode',
    },
  }));
  window.Configuration = { amount: 0 };
  store.checkoutConfiguration = {

  };
  store.checkout = {
   options: {}
  };
  createSession.mockReturnValue({
    adyenConnectedTerminals: { uniqueTerminalIds: ['mocked_id'] },
    id: 'mock_id',
    sessionData: 'mock_session_data',
    imagePath: 'example.com',
    adyenDescriptions: {},
  });

  fetchGiftCards.mockReturnValue({
    giftCards: [
      {
        orderAmount: {
          currency: '',
          value: '',
        },
      },
    ],
  });
});
describe('Render Generic Component', () => {
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

    store.componentsObj = { foo: 'bar', bar: 'baz' };
    store.checkoutConfiguration.paymentMethodsConfiguration = { amazonpay: {} };
    await renderGenericComponent();
    expect(createSession).toBeCalled();
    expect(store.checkoutConfiguration).toMatchSnapshot();
    expect(
        document.querySelector('input[type=radio][name=brandCode]').value,
    ).toBeTruthy();
  });
});
