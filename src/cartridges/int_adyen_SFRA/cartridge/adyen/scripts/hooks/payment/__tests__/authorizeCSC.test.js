const { authorize } = require('../authorizeCSC');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

const buildOrder = (stateCode) => ({
  orderNo: '00001202',
  custom: {},
  customerLocaleID: 'en_US',
  getCustomerNo: () => 'mocked_customerNo',
  getCustomerEmail: () => 'shopper@example.com',
  addNote: jest.fn(),
  getBillingAddress: () => ({
    address1: 'Simon Carmiggeltstraat 6',
    city: 'Amsterdam',
    postalCode: '1011DJ',
    countryCode: { value: 'nl' },
    stateCode,
  }),
});

const buildOrderPaymentInstrument = () => ({
  getPaymentTransaction: () => ({
    amount: { currencyCode: 'EUR' },
    getPaymentProcessor: () => ({ getID: () => 'Adyen_Component' }),
  }),
});

const getSentBillingAddress = () =>
  AdyenHelper.executeCall.mock.calls[0][1].billingAddress;

describe('authorizeCSC payment link request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.request.clientId = 'dw.csc';
    AdyenHelper.executeCall.mockReturnValue({
      url: 'https://test.adyen.link/PL123',
    });
    AdyenHelper.getCurrencyValueForApi.mockReturnValue({
      getValueOrNull: () => 1000,
    });
  });

  it('includes stateOrProvince when the billing address has a stateCode', () => {
    authorize(buildOrder('NH'), buildOrderPaymentInstrument());

    expect(getSentBillingAddress().stateOrProvince).toBe('NH');
  });

  it('omits stateOrProvince entirely when the billing address has no stateCode', () => {
    authorize(buildOrder(null), buildOrderPaymentInstrument());

    expect('stateOrProvince' in getSentBillingAddress()).toBe(false);
  });

  it('keeps the N/A fallbacks for the other billing address fields', () => {
    const order = buildOrder('NH');
    const billingAddress = order.getBillingAddress();
    order.getBillingAddress = () => ({
      ...billingAddress,
      city: null,
      postalCode: null,
    });

    authorize(order, buildOrderPaymentInstrument());

    expect(getSentBillingAddress().city).toBe('N/A');
    expect(getSentBillingAddress().postalCode).toBe('N/A');
  });
});
