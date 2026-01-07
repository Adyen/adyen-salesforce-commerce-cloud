jest.mock('dw/object/CustomObjectMgr', () => ({
  getCustomObject: jest.fn(),
  createCustomObject: jest.fn(),
}));
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const constants = require('../constants');
const {
  createOrUpdateCustomObject,
  setCustomObjectStatus,
  createLogMessage,
} = require('../customObjectHelper');

const mockCustomObj = () => ({
  custom: {},
});

describe('customObjectHelper', () => {
  describe('createOrUpdateCustomObject', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('creates a new custom object if not existing', () => {
      CustomObjectMgr.getCustomObject.mockReturnValue(null);
      CustomObjectMgr.createCustomObject.mockImplementation((type, key) => mockCustomObj());
      Transaction.wrap.mockImplementation(fn => fn());
      const data = { foo: 'bar', bar: 123 };
      const result = createOrUpdateCustomObject('type', 'key', data);
      expect(CustomObjectMgr.createCustomObject).toHaveBeenCalledWith('type', 'key');
      expect(result.custom.foo).toBe('bar');
      expect(result.custom.bar).toBe(123);
    });

    it('updates an existing custom object', () => {
      const obj = mockCustomObj();
      CustomObjectMgr.getCustomObject.mockReturnValue(obj);
      Transaction.wrap.mockImplementation(fn => fn());
      const data = { foo: 'baz' };
      const result = createOrUpdateCustomObject('type', 'key', data);
      expect(CustomObjectMgr.createCustomObject).not.toHaveBeenCalled();
      expect(result.custom.foo).toBe('baz');
    });

    it('ignores unknown fields (throws)', () => {
      const obj = mockCustomObj();
      Object.defineProperty(obj.custom, 'foo', {
        set() { throw new Error('unknown field'); },
      });
      CustomObjectMgr.getCustomObject.mockReturnValue(obj);
      Transaction.wrap.mockImplementation(fn => fn());
      const data = { foo: 'should not throw' };
      expect(() => createOrUpdateCustomObject('type', 'key', data)).not.toThrow();
    });
  });

  describe('setCustomObjectStatus', () => {
    let customObj;
    beforeEach(() => {
      customObj = mockCustomObj();
      jest.clearAllMocks();
    });

    it('sets status to PROCESS and logs for PROCESS_EVENTS', () => {
      constants.PROCESS_EVENTS = ['CAPTURE'];
      constants.UPDATE_STATUS = { PROCESS: 'PROC', PENDING: 'PEND' };
      setCustomObjectStatus(customObj, 'CAPTURE', 'ref123', {});
      expect(customObj.custom.updateStatus).toBe('PROC');
      expect(AdyenLogs.info_log).toHaveBeenCalled();
    });

    it('sets status to PENDING and logs for non-PROCESS_EVENTS', () => {
      constants.PROCESS_EVENTS = ['CAPTURE'];
      constants.UPDATE_STATUS = { PROCESS: 'PROC', PENDING: 'PEND' };
      setCustomObjectStatus(customObj, 'REFUND', 'ref123', {});
      expect(customObj.custom.updateStatus).toBe('PEND');
      expect(AdyenLogs.info_log).toHaveBeenCalled();
    });

    it('sets Adyen_log for AUTHORISATION eventCode', () => {
      constants.PROCESS_EVENTS = [];
      constants.UPDATE_STATUS = { PROCESS: 'PROC', PENDING: 'PEND' };
      setCustomObjectStatus(customObj, 'AUTHORISATION', 'ref123', { foo: 'bar' });
      expect(customObj.custom.Adyen_log).toBe(JSON.stringify({ foo: 'bar' }));
    });
  });

  describe('createLogMessage', () => {
    it('returns a formatted log message', () => {
      const notificationData = {
        reason: 'reason',
        eventDate: 'date',
        merchantReference: 'ref',
        currency: 'EUR',
        pspReference: 'psp',
        merchantAccountCode: 'acc',
        eventCode: 'CAPTURE',
        value: 100,
        operations: 'ops',
        success: true,
        paymentMethod: 'visa',
        live: false,
      };
      const msg = createLogMessage(notificationData);
      expect(msg).toContain('AdyenNotification v');
      expect(msg).toContain('reason : reason');
      expect(msg).toContain('eventCode : CAPTURE');
      expect(msg).toContain('live : false');
    });
  });
});
