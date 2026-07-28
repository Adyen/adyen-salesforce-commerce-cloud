/* eslint-disable global-require */
let adyenGiving;
let AdyenHelper;
let OrderMgr;

const donationAmount = { value: '1000', currency: 'EUR' };

const createPaymentTransactionCustom = () => ({
  Adyen_donationToken: 'mocked_donationToken',
  Adyen_pspReference: 'mocked_pspReference',
});

const createOrder = (paymentTransactionCustom) => ({
  custom: {},
  getTotalGrossPrice: jest.fn(() => ({ value: 5000 })),
  getPaymentInstruments: jest.fn(() => [
    { paymentTransaction: { custom: paymentTransactionCustom } },
  ]),
});

const createCampaignsResponse = (donation) => ({
  donationCampaigns: [{ id: 'mocked_campaignId', donation }],
});

beforeEach(() => {
  adyenGiving = require('../adyenGiving');
  AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
  OrderMgr = require('dw/order/OrderMgr');
  jest.clearAllMocks();
  AdyenHelper.getCurrencyValueForApi.mockReturnValue(1000);
});

afterEach(() => {
  jest.resetModules();
});

describe('donate', () => {
  it('should send a donation request without a payment method', () => {
    OrderMgr.getOrder.mockReturnValueOnce(
      createOrder(createPaymentTransactionCustom()),
    );
    AdyenHelper.executeCall
      .mockReturnValueOnce(createCampaignsResponse())
      .mockReturnValueOnce({ status: 'completed' });

    const response = adyenGiving.donate(
      'mocked_orderNo',
      donationAmount,
      'mocked_orderToken',
    );

    expect(OrderMgr.getOrder).toHaveBeenCalledWith(
      'mocked_orderNo',
      'mocked_orderToken',
    );

    const [service, requestObject] = AdyenHelper.executeCall.mock.calls[1];
    expect(service).toBe('AdyenGiving');
    expect(requestObject).not.toHaveProperty('paymentMethod');
    expect(requestObject).toEqual({
      merchantAccount: 'mocked_merchant_account',
      donationCampaignId: 'mocked_campaignId',
      amount: donationAmount,
      reference: 'mocked_merchant_account-mocked_orderNo',
      donationOriginalPspReference: 'mocked_pspReference',
      donationToken: 'mocked_donationToken',
    });
    expect(response).toEqual({ status: 'completed' });
  });

  it('should throw when the donation reference does not match the session order number', () => {
    expect(() =>
      adyenGiving.donate('other_orderNo', donationAmount, 'mocked_orderToken'),
    ).toThrow('Donation reference is invalid');
    expect(AdyenHelper.executeCall).not.toHaveBeenCalled();
  });

  it('should throw when no donation campaigns are available', () => {
    OrderMgr.getOrder.mockReturnValue(
      createOrder(createPaymentTransactionCustom()),
    );

    AdyenHelper.executeCall.mockReturnValueOnce({ error: true });
    expect(() =>
      adyenGiving.donate('mocked_orderNo', donationAmount, 'mocked_orderToken'),
    ).toThrow('Donation campaigns are not available');

    AdyenHelper.executeCall.mockReturnValueOnce({ donationCampaigns: [] });
    expect(() =>
      adyenGiving.donate('mocked_orderNo', donationAmount, 'mocked_orderToken'),
    ).toThrow('Donation campaigns are not available');

    expect(AdyenHelper.executeCall).toHaveBeenCalledTimes(2);
  });

  it('should validate the donation amount against the roundup amount', () => {
    const roundupCampaign = createCampaignsResponse({
      type: 'roundup',
      maxRoundupAmount: 100,
    });

    OrderMgr.getOrder.mockReturnValue(
      createOrder(createPaymentTransactionCustom()),
    );
    AdyenHelper.getCurrencyValueForApi.mockReturnValue(1030);

    AdyenHelper.executeCall.mockReturnValueOnce(roundupCampaign);
    expect(() =>
      adyenGiving.donate(
        'mocked_orderNo',
        { value: '100', currency: 'EUR' },
        'mocked_orderToken',
      ),
    ).toThrow('Donation amount does not match the roundup amount');
    expect(AdyenHelper.executeCall).toHaveBeenCalledTimes(1);

    AdyenHelper.executeCall
      .mockReturnValueOnce(roundupCampaign)
      .mockReturnValueOnce({ status: 'completed' });
    adyenGiving.donate(
      'mocked_orderNo',
      { value: '70', currency: 'EUR' },
      'mocked_orderToken',
    );
    expect(AdyenHelper.executeCall.mock.calls[2][1]).not.toHaveProperty(
      'paymentMethod',
    );
  });

  it('should only clear the donation token when the donation is completed', () => {
    const completedCustom = createPaymentTransactionCustom();
    const completedOrder = createOrder(completedCustom);
    OrderMgr.getOrder.mockReturnValueOnce(completedOrder);
    AdyenHelper.executeCall
      .mockReturnValueOnce(createCampaignsResponse())
      .mockReturnValueOnce({ status: 'completed' });
    adyenGiving.donate('mocked_orderNo', donationAmount, 'mocked_orderToken');
    expect(completedCustom.Adyen_donationToken).toBeNull();
    expect(completedOrder.custom.Adyen_donationAmount).toBe(
      JSON.stringify(donationAmount),
    );

    const pendingCustom = createPaymentTransactionCustom();
    OrderMgr.getOrder.mockReturnValueOnce(createOrder(pendingCustom));
    AdyenHelper.executeCall
      .mockReturnValueOnce(createCampaignsResponse())
      .mockReturnValueOnce({ status: 'pending' });
    adyenGiving.donate('mocked_orderNo', donationAmount, 'mocked_orderToken');
    expect(pendingCustom.Adyen_donationToken).toBe('mocked_donationToken');
  });
});
