const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

jest.mock('../payment');
jest.mock('../order');

const handleAuthorised = require('../authorise');
const payment = require('../payment');

let req;

beforeEach(() => {
  jest.clearAllMocks();
  req = { locale: { id: 'mocked_locale' } };
});

describe('Authorise', () => {
  it('should handle error', () => {
    COHelpers.placeOrder.mockReturnValue({ error: true });
    const result = { resultCode: 'Authorised' };
    handleAuthorised({}, result, {}, {});
    expect(payment.handlePaymentError).toBeCalledTimes(1);
  });
  it('should confirm order', () => {
    COHelpers.placeOrder.mockReturnValue({ error: false });
    const result = { resultCode: 'Authorised' };
    handleAuthorised({}, result, {}, { req });
    expect(payment.handlePaymentError).toBeCalledTimes(0);
  });
});
