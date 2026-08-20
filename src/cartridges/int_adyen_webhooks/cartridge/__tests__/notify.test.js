/* eslint-disable global-require */

jest.mock(
  '*/cartridge/libs/libAuthenticationUtils',
  () => ({
    checkGivenCredentials: jest.fn(() => true),
    calculateHmacSignature: jest.fn(() => 'mocked_signature'),
  }),
  { virtual: true },
);

let req;
let res;
let next;
let notify;

// Models the SFCC transaction state so that committing or rolling back a closed
// transaction fails the way it does on an instance
function mockTransactionState(Transaction) {
  const state = { isOpen: false };
  Transaction.begin.mockImplementation(() => {
    if (state.isOpen) {
      throw new Error('a transaction is already open');
    }
    state.isOpen = true;
  });
  Transaction.commit.mockImplementation(() => {
    if (!state.isOpen) {
      throw new Error('there is no transaction to commit');
    }
    state.isOpen = false;
  });
  Transaction.rollback.mockImplementation(() => {
    if (!state.isOpen) {
      throw new Error('there is no transaction to roll back');
    }
    state.isOpen = false;
  });
  // A nested wrap joins the open transaction and rolls all of it back when its
  // callback throws
  Transaction.wrap.mockImplementation((callback) => {
    const isOwner = !state.isOpen;
    state.isOpen = true;
    try {
      const result = callback();
      state.isOpen = !isOwner;
      return result;
    } catch (error) {
      state.isOpen = false;
      throw error;
    }
  });
  return state;
}

function createResponseMock() {
  const viewData = {};
  return {
    render: jest.fn(),
    json: jest.fn(),
    setStatusCode: jest.fn(),
    setViewData: jest.fn((data) => Object.assign(viewData, data)),
    getViewData: jest.fn(() => viewData),
  };
}

beforeEach(() => {
  const { adyen } = require('../../../int_adyen_SFRA/cartridge/controllers/middlewares/index');
  notify = adyen.notify;
  jest.clearAllMocks();
  req = {};
  res = createResponseMock();
  next = jest.fn();
});

afterEach(() => {
  jest.resetModules();
});

describe('Notify', () => {
  it('should respond 403 without opening a transaction when status is falsy', () => {
    const Transaction = require('dw/system/Transaction');
    const checkAuth = require('*/cartridge/checkNotificationAuth');
    checkAuth.check.mockImplementation(() => false);
    notify(req, res, next);
    expect(res.setStatusCode).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith('/adyen/error');
    expect(Transaction.begin).not.toHaveBeenCalled();
    expect(Transaction.rollback).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
  it('should respond 403 when the HMAC signature is invalid', () => {
    const Transaction = require('dw/system/Transaction');
    const checkAuth = require('*/cartridge/checkNotificationAuth');
    checkAuth.validateHmacSignature.mockImplementation(() => false);
    notify(req, res, next);
    expect(res.setStatusCode).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith('/adyen/error');
    expect(Transaction.rollback).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
  it('should respond 403 when the notification carries no HMAC signature', () => {
    const Transaction = require('dw/system/Transaction');
    const checkAuth = require('*/cartridge/checkNotificationAuth');
    const { validateHmacSignature } = require('../checkNotificationAuth');
    checkAuth.validateHmacSignature.mockImplementation(validateHmacSignature);
    req = { form: { merchantReference: 'mocked_reference' } };
    notify(req, res, next);
    expect(res.setStatusCode).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith('/adyen/error');
    expect(Transaction.begin).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
  it('should render notify when notification result is successful', () => {
    const Transaction = require('dw/system/Transaction');
    const handleNotify = require('*/cartridge/handleNotify');
    handleNotify.notify.mockImplementation(() => ({ success: true }));
    notify(req, res, next);
    expect(res.render).toHaveBeenCalledWith('/notify');
    expect(res.setStatusCode).not.toHaveBeenCalled();
    expect(Transaction.commit).toHaveBeenCalled();
    expect(Transaction.rollback).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
  it('should respond 500 and roll back when notification result is not successful', () => {
    const Transaction = require('dw/system/Transaction');
    const handleNotify = require('*/cartridge/handleNotify');
    handleNotify.notify.mockImplementation(() => ({
      success: false,
      errorMessage: 'mocked_error_message',
    }));
    notify(req, res, next);
    expect(res.setStatusCode).toHaveBeenCalledWith(500);
    expect(Transaction.rollback).toHaveBeenCalled();
    expect(Transaction.commit).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(res.render.mock.calls).toMatchSnapshot();
  });
  it('should respond 500 when a nested transaction of handleNotify was rolled back', () => {
    const Transaction = require('dw/system/Transaction');
    const handleNotify = require('*/cartridge/handleNotify');
    const transactionState = mockTransactionState(Transaction);
    // handleNotify writes its custom objects in a nested transaction and
    // swallows the failure, see handleNotify.notify
    handleNotify.notify.mockImplementation(() => {
      try {
        Transaction.wrap(() => {
          throw new Error('mocked_custom_object_error');
        });
        return { success: true };
      } catch (error) {
        return { success: false, errorMessage: error.message };
      }
    });
    notify(req, res, next);
    expect(res.setStatusCode).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith('/notifyError', {
      errorMessage: 'mocked_custom_object_error',
    });
    expect(Transaction.commit).not.toHaveBeenCalled();
    expect(transactionState.isOpen).toBe(false);
    expect(next).toHaveBeenCalled();
  });
  it('should respond 500 and roll back when processing throws', () => {
    const Transaction = require('dw/system/Transaction');
    const handleNotify = require('*/cartridge/handleNotify');
    handleNotify.notify.mockImplementation(() => {
      throw new Error('mocked_unexpected_error');
    });
    notify(req, res, next);
    expect(res.setStatusCode).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith('/notifyError', {
      errorMessage: 'mocked_unexpected_error',
    });
    expect(Transaction.rollback).toHaveBeenCalled();
    expect(Transaction.commit).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
