jest.mock('dw/order/OrderMgr', () => ({
  getOrder: jest.fn(),
}));

// Event handlers are resolved through the cartridge path, so each one is mocked
// under the path handleCustomObject builds at runtime
jest.mock(
  '*/cartridge/eventHandlers/CAPTURE',
  () => ({
    handle: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/eventHandlers/PENDING',
  () => ({
    handle: jest.fn(() => ({ pending: true })),
  }),
  { virtual: true },
);

const OrderMgr = require('dw/order/OrderMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const captureHandler = require('*/cartridge/eventHandlers/CAPTURE');
const pendingHandler = require('*/cartridge/eventHandlers/PENDING');
const { handle, execute } = require('../handleCustomObject');

const TEN_MINUTES = 10 * 60 * 1000;

function mockOrder(overrides = {}) {
  return {
    orderNo: '00001234',
    creationDate: new Date(Date.now() - TEN_MINUTES),
    custom: { Adyen_pspReference: '' },
    addNote: jest.fn(),
    getTotalGrossPrice: jest.fn(() => ({ value: 100 })),
    ...overrides,
  };
}

function mockCustomObj(custom = {}) {
  return {
    custom: {
      orderId: '00001234-20240101',
      eventCode: 'CAPTURE',
      pspReference: 'mocked_pspReference',
      version: '1',
      ...custom,
    },
  };
}

describe('handleCustomObject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    captureHandler.handle.mockImplementation(() => undefined);
    pendingHandler.handle.mockImplementation(() => ({ pending: true }));
  });

  it('resolves the handler through the cartridge path and finalizes the order', () => {
    const order = mockOrder();
    const customObj = mockCustomObj();
    OrderMgr.getOrder.mockReturnValue(order);

    const result = handle(customObj);

    expect(OrderMgr.getOrder).toHaveBeenCalledWith('00001234');
    expect(captureHandler.handle).toHaveBeenCalledWith({
      order,
      customObj,
      result,
      totalAmount: 1000,
    });
    expect(order.custom.Adyen_pspReference).toBe('mocked_pspReference');
    expect(order.addNote).toHaveBeenCalledWith(
      'Adyen Payment Notification',
      expect.stringContaining('eventCode : CAPTURE'),
    );
    expect(customObj.custom.processedStatus).toBe('SUCCESS');
    expect(customObj.custom.updateStatus).toBe('SUCCESS');
    expect(result.status).toBe(PIPELET_NEXT);
    expect(result.Pending).toBe(false);
  });

  it('keeps an existing PSP reference on the order', () => {
    const order = mockOrder({ custom: { Adyen_pspReference: 'existing_psp' } });
    OrderMgr.getOrder.mockReturnValue(order);

    handle(mockCustomObj());

    expect(order.custom.Adyen_pspReference).toBe('existing_psp');
  });

  it('propagates the pending status returned by the PENDING handler', () => {
    OrderMgr.getOrder.mockReturnValue(mockOrder());

    const result = handle(mockCustomObj({ eventCode: 'PENDING' }));

    expect(pendingHandler.handle).toHaveBeenCalled();
    expect(result.Pending).toBe(true);
    expect(result.status).toBe(PIPELET_NEXT);
  });

  it('logs an unhandled status and does not finalize when no handler module exists', () => {
    const order = mockOrder();
    const customObj = mockCustomObj({ eventCode: 'NOT_A_REAL_EVENT_CODE' });
    OrderMgr.getOrder.mockReturnValue(order);

    const result = handle(customObj);

    expect(AdyenLogs.info_log).toHaveBeenCalledWith(
      'No handler module found for event code: NOT_A_REAL_EVENT_CODE',
    );
    expect(AdyenLogs.info_log).toHaveBeenCalledWith(
      'Order 00001234 received unhandled status NOT_A_REAL_EVENT_CODE',
    );
    expect(order.addNote).not.toHaveBeenCalled();
    expect(customObj.custom.processedStatus).toBeUndefined();
    expect(result.status).toBe(PIPELET_NEXT);
    expect(result.Pending).toBe(false);
  });

  it('reports a throwing handler as an error instead of a missing module', () => {
    const order = mockOrder();
    const customObj = mockCustomObj();
    const handlerError = new Error('mocked_handler_error');
    captureHandler.handle.mockImplementation(() => {
      throw handlerError;
    });
    OrderMgr.getOrder.mockReturnValue(order);

    const result = handle(customObj);

    expect(AdyenLogs.error_log).toHaveBeenCalledWith(
      'Handler for event code CAPTURE failed for order 00001234',
      handlerError,
    );
    expect(AdyenLogs.info_log).not.toHaveBeenCalledWith(
      'No handler module found for event code: CAPTURE',
    );
    expect(order.addNote).not.toHaveBeenCalled();
    expect(customObj.custom.updateStatus).toBeUndefined();
    expect(result.status).toBe(PIPELET_NEXT);
  });

  it('skips a missing order for a $0.00 recurring payment authorisation', () => {
    const customObj = mockCustomObj({
      orderId: 'recurringPayment-00001234-20240101',
    });
    OrderMgr.getOrder.mockReturnValue(null);

    const result = handle(customObj);

    expect(result.SkipOrder).toBe(true);
    expect(customObj.custom.processedStatus).toBe('SUCCESS');
    expect(result.status).toBe(PIPELET_ERROR);
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
  });

  it('logs an error for a missing order that is not a recurring payment', () => {
    const customObj = mockCustomObj();
    OrderMgr.getOrder.mockReturnValue(null);

    const result = handle(customObj);

    expect(AdyenLogs.error_log).toHaveBeenCalledWith(
      'Notification for not existing order 00001234-20240101 received.',
    );
    expect(result.SkipOrder).toBe(false);
    expect(customObj.custom.processedStatus).toBeUndefined();
  });

  it('skips an order that is still inside the notification delay window', () => {
    const order = mockOrder({ creationDate: new Date() });
    OrderMgr.getOrder.mockReturnValue(order);

    const result = handle(mockCustomObj());

    expect(result.SkipOrder).toBe(true);
    expect(result.status).toBe(PIPELET_NEXT);
    expect(captureHandler.handle).not.toHaveBeenCalled();
  });

  it('maps the handler result onto the job arguments and returns the status', () => {
    const order = mockOrder();
    OrderMgr.getOrder.mockReturnValue(order);
    const args = { CustomObj: mockCustomObj({ eventCode: 'PENDING' }) };

    const status = execute(args);

    expect(status).toBe(PIPELET_NEXT);
    expect(args.EventCode).toBe('PENDING');
    expect(args.SubmitOrder).toBe(false);
    expect(args.SkipOrder).toBe(false);
    expect(args.Pending).toBe(true);
    expect(args.Order).toBe(order);
  });
});
