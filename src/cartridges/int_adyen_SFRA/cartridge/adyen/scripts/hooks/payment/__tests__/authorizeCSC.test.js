const { authorize } = require('../authorizeCSC');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');

const buildOrder = (stateCode, customerLocaleID = 'en_US') => ({
  orderNo: '00001202',
  custom: {},
  customerLocaleID,
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

const getSentPaymentLinkRequest = () =>
  AdyenHelper.executeCall.mock.calls[0][1];

const getSentBillingAddress = () => getSentPaymentLinkRequest().billingAddress;

describe('authorizeCSC payment link request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.request.clientId = 'dw.csc';
    AdyenConfigs.getAdyenDefaultLocale.mockReturnValue('nl_NL');
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

  it('falls back to N/A when the billing address has no stateCode', () => {
    authorize(buildOrder(null), buildOrderPaymentInstrument());

    expect(getSentBillingAddress().stateOrProvince).toBe('N/A');
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

  it('sends the locale of the order as shopperLocale', () => {
    authorize(buildOrder('NH', 'fr_FR'), buildOrderPaymentInstrument());

    expect(getSentPaymentLinkRequest().shopperLocale).toBe('fr-FR');
  });

  it('sends the configured default locale when the order has no specific locale', () => {
    authorize(buildOrder('NH', 'default'), buildOrderPaymentInstrument());

    expect(getSentPaymentLinkRequest().shopperLocale).toBe('nl-NL');
  });
});
