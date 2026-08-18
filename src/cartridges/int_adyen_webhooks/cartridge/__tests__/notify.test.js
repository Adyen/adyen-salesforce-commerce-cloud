/* eslint-disable global-require */

let req;
let res;
let next;
let notify;

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
