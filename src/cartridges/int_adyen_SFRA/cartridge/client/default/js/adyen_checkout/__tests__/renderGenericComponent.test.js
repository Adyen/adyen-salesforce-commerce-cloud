import { renderGenericComponent } from '../renderGenericComponent';
import store from '../../../../../store';

beforeEach(() => {
  window.AdyenCheckout = jest.fn();
  window.Configuration = { amount: 0 };
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
    document.body.innerHTML = `
      <div id="paymentMethodsList"></div>
      <input type="radio" name="brandCode" value="card" />
      <button value="submit-payment">Submit</button>
      <div id="component_card"></div>
      <div id="adyenPosTerminals">
        <span>Child #1</span>
      </div>
    `;
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
        paymentMethods: [{ type: 'scheme', name: 'Card' }],
        storedPaymentMethods: true,
      },
      ImagePath: 'example.com',
      AdyenDescriptions: [{ description: 'mocked_description' }],
    };

    $.ajax = jest.fn(({ success }) => success(mockedSuccessResponse));
    store.componentsObj = { foo: 'bar', bar: 'baz' };
    await renderGenericComponent();
    expect(store.checkoutConfiguration).toMatchSnapshot();
    expect(
      document.querySelector('input[type=radio][name=brandCode]').value,
    ).toBeTruthy();
  });
});
