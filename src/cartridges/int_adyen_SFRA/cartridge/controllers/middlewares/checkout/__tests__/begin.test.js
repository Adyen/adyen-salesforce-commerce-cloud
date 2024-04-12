/* eslint-disable global-require */
const {
  checkout: { begin },
} = require('../../index');
const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');
const ShippingMgr = require('dw/order/ShippingMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');

let res;
let req;
beforeEach(() => {
  jest.clearAllMocks();
  req = {
    currentCustomer: { raw: { isAuthenticated: jest.fn(() => false) } },
    session: { privacyCache: { get: jest.fn(), set: jest.fn() } },
  };
  res = { getViewData: jest.fn(() => ({})), setViewData: jest.fn() };
});

describe('Begin', () => {
  it('should update saved cards', () => {
    const {
      updateSavedCards,
    } = require('*/cartridge/adyen/scripts/payments/updateSavedCards');
    req.currentCustomer.raw.isAuthenticated.mockImplementation(() => true);
    begin(req, res, jest.fn());
    expect(updateSavedCards).toBeCalledTimes(1);
  });
  it('should set view data', () => {
    begin(req, res, jest.fn());
    expect(res.setViewData.mock.calls).toMatchSnapshot();
  });

  it('should not attempt to restore cart when no order number is cached', () =>{
    begin(req, res, jest.fn());
    expect(res.setViewData.mock.calls).toMatchSnapshot();
    expect(OrderMgr.failOrder).not.toHaveBeenCalled();
  })

  it('should not attempt to restore cart when cart is not empty', () => {
    req.session.privacyCache.get.mockImplementationOnce(() =>{ return '12312' });
    OrderMgr.status = { value: "0"};
    begin(req, res, jest.fn());
    expect(Transaction.wrap).not.toHaveBeenCalled();
  })

  it('should successfully restore cart when current cart is empty and order number is in cache', () => {
    req.session.privacyCache.get.mockImplementationOnce(() =>{ return "0" });
    BasketMgr.getAllProductLineItems.mockImplementationOnce(() =>{ return []; });
    begin(req, res, jest.fn());
    expect(Transaction.wrap).toHaveBeenCalled();
  })
});
