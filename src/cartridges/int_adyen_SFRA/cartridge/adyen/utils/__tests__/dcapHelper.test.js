const dcapHelper = require('../dcapHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function getUsCardPaymentRequest() {
  return {
    shopperInteraction: 'Ecommerce',
    paymentMethod: { type: 'scheme' },
    shopperIP: '192.0.2.1',
    shopperEmail: 'shopper@example.com',
    billingAddress: {
      city: 'New York',
      country: 'US',
      houseNumberOrName: '1',
      postalCode: '10001',
      stateOrProvince: 'NY',
      street: 'Main Street',
    },
  };
}

describe('DCAP helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a merchant-provided device fingerprint', () => {
    const paymentRequest = getUsCardPaymentRequest();
    paymentRequest.deviceFingerprint = 'merchant-fingerprint';

    expect(dcapHelper.getMissingDcapFields(paymentRequest)).toEqual([]);
  });

  it('warns only with missing US DCAP field names', () => {
    const paymentRequest = getUsCardPaymentRequest();
    paymentRequest.shopperIP = '';
    paymentRequest.shopperEmail = ' ';
    paymentRequest.billingAddress.houseNumberOrName = '';
    paymentRequest.billingAddress.stateOrProvince = 'N/A';

    dcapHelper.warnForMissingDcapFields(paymentRequest);

    expect(AdyenLogs.warning_log).toHaveBeenCalledWith(
      'DCAP data missing for US card payment: shopperIP, shopperEmail, billingAddress.houseNumberOrName, billingAddress.stateOrProvince, deviceFingerprint',
    );
    expect(AdyenLogs.warning_log.mock.calls[0][0]).not.toContain(
      'shopper@example.com',
    );
  });

  it('does not warn for non-US payments with legacy address placeholders', () => {
    const paymentRequest = getUsCardPaymentRequest();
    paymentRequest.billingAddress.country = 'NL';
    paymentRequest.billingAddress.city = 'N/A';
    paymentRequest.billingAddress.stateOrProvince = 'N/A';

    dcapHelper.warnForMissingDcapFields(paymentRequest);

    expect(AdyenLogs.warning_log).not.toHaveBeenCalled();
  });
});
