const handlePaymentMethod = require('../payment');

let req;
let res;
let AdyenHelper;
beforeEach(() => {
  jest.clearAllMocks();
  AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  req = { locale: 'NL', currentCustomer: 'curCustomer' };
  res = { json: jest.fn() };
});
describe('Payment', () => {
  it('should return json response with installments', () => {
    AdyenHelper.getCreditCardInstallments.mockReturnValue(true);
    handlePaymentMethod({ req, res, next: jest.fn() });
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should return json response without installments', () => {
    AdyenHelper.getCreditCardInstallments.mockReturnValue(false);
    handlePaymentMethod({ req, res, next: jest.fn() });
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});
