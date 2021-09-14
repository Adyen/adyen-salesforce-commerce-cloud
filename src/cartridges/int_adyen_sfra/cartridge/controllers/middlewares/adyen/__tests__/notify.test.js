/* eslint-disable global-require */

let req;
let res;
let notify;

beforeEach(() => {
  const { adyen } = require('../../index');
  notify = adyen.notify;
  jest.clearAllMocks();
  req = {};
  res = { render: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});

describe('Notify', () => {
  it('should render error when status is falsy', () => {
    const checkAuth = require('*/cartridge/scripts/checkNotificationAuth');
    checkAuth.check.mockImplementation(() => false);
    notify(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith('/adyen/error');
  });
  it('should render notify when notification result is successful', () => {
    const handleNotify = require('*/cartridge/scripts/handleNotify');
    handleNotify.notify.mockImplementation(() => ({ success: true }));
    notify(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith('/notify');
  });
  it('should render notifyError when notification result is not successful', () => {
    const handleNotify = require('*/cartridge/scripts/handleNotify');
    handleNotify.notify.mockImplementation(() => ({
      success: false,
      errorMessage: 'mocked_error_message',
    }));
    notify(req, res, jest.fn());
    expect(res.render.mock.calls).toMatchSnapshot();
  });
});
