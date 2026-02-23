const failUnsuccessfulKlarnaInlineOrder = require('../failUnsuccessfulKlarnaInlineOrder');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');

describe('failUnsuccessfulKlarnaInlineOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    session.privacy = {};
  });

  it('should fail order and clear session variables when attemptedKlarnaPayment and orderNo exist', () => {
    session.privacy.attemptedKlarnaPayment = true;
    session.privacy.orderNo = 'mocked_orderNo';
    const mockOrder = { orderNo: 'mocked_orderNo' };
    OrderMgr.getOrder.mockReturnValue(mockOrder);

    failUnsuccessfulKlarnaInlineOrder();

    expect(OrderMgr.getOrder).toHaveBeenCalledWith('mocked_orderNo');
    expect(Transaction.wrap).toHaveBeenCalled();
    expect(OrderMgr.failOrder).toHaveBeenCalledWith(mockOrder, true);
    expect(session.privacy.attemptedKlarnaPayment).toBeNull();
    expect(session.privacy.orderNo).toBeNull();
  });

  it('should not fail order when attemptedKlarnaPayment is missing', () => {
    session.privacy.orderNo = 'mocked_orderNo';

    failUnsuccessfulKlarnaInlineOrder();

    expect(OrderMgr.getOrder).not.toHaveBeenCalled();
    expect(Transaction.wrap).not.toHaveBeenCalled();
  });

  it('should not fail order when orderNo is missing', () => {
    session.privacy.attemptedKlarnaPayment = true;

    failUnsuccessfulKlarnaInlineOrder();

    expect(OrderMgr.getOrder).not.toHaveBeenCalled();
    expect(Transaction.wrap).not.toHaveBeenCalled();
  });
});
