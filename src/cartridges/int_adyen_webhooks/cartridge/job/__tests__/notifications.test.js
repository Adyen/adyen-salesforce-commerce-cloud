/* eslint-disable global-require */
jest.mock(
  'dw/object/CustomObjectMgr',
  () => ({ queryCustomObjects: jest.fn() }),
  { virtual: true },
);

jest.mock('*/cartridge/handleCustomObject', () => ({ handle: jest.fn() }), {
  virtual: true,
});

jest.mock('*/cartridge/deleteCustomObjects', () => ({ remove: jest.fn() }), {
  virtual: true,
});

let notifications;
let CustomObjectMgr;
let objectsHandler;
let COHelpers;
let AdyenLogs;
let AdyenConfigs;

const buildOrder = (customerLocaleID) => ({
  orderNo: 'mocked_orderNo',
  status: { value: 'mocked_status' },
  getCustomerLocaleID: () => customerLocaleID,
});

const mockSearchQuery = (customObjects) => {
  let index = 0;
  CustomObjectMgr.queryCustomObjects.mockReturnValue({
    count: customObjects.length,
    hasNext: () => index < customObjects.length,
    next: () => {
      const customObj = customObjects[index];
      index += 1;
      return customObj;
    },
    close: jest.fn(),
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  global.PIPELET_NEXT = 'mocked_next';
  global.PIPELET_ERROR = 'mocked_error';
  notifications = require('../notifications');
  CustomObjectMgr = require('dw/object/CustomObjectMgr');
  objectsHandler = require('*/cartridge/handleCustomObject');
  COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
  AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
  AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
  COHelpers.sendConfirmationEmail.mockReset();
  AdyenConfigs.getAdyenDefaultLocale.mockReturnValue('en_US');
});

afterEach(() => {
  jest.resetModules();
});

describe('processNotifications', () => {
  it('sends the confirmation email with the locale ID of the order', () => {
    const order = buildOrder('nl_NL');
    objectsHandler.handle.mockReturnValue({
      status: 'mocked_ok',
      SubmitOrder: true,
      Order: order,
    });
    mockSearchQuery(['mocked_customObject']);

    notifications.processNotifications();

    expect(COHelpers.sendConfirmationEmail).toHaveBeenCalledWith(
      order,
      'nl_NL',
    );
  });

  it('sends the confirmation email with the fallback locale ID when the order has no specific locale', () => {
    AdyenConfigs.getAdyenDefaultLocale.mockReturnValue('nl_NL');
    const order = buildOrder('default');
    objectsHandler.handle.mockReturnValue({
      status: 'mocked_ok',
      SubmitOrder: true,
      Order: order,
    });
    mockSearchQuery(['mocked_customObject']);

    notifications.processNotifications();

    expect(COHelpers.sendConfirmationEmail).toHaveBeenCalledWith(
      order,
      'nl_NL',
    );
  });

  it('applies the locale of the order while sending the confirmation email and restores the job locale afterwards', () => {
    global.request.getLocale.mockReturnValueOnce('en_US');
    objectsHandler.handle.mockReturnValue({
      status: 'mocked_ok',
      SubmitOrder: true,
      Order: buildOrder('nl_NL'),
    });
    mockSearchQuery(['mocked_customObject']);

    notifications.processNotifications();

    expect(global.request.setLocale.mock.calls).toEqual([['nl_NL'], ['en_US']]);
  });

  it('restores the job locale when sending the confirmation email fails', () => {
    global.request.getLocale.mockReturnValueOnce('en_US');
    objectsHandler.handle.mockReturnValue({
      status: 'mocked_ok',
      SubmitOrder: true,
      Order: buildOrder('nl_NL'),
    });
    COHelpers.sendConfirmationEmail.mockImplementationOnce(() => {
      throw new Error('mocked_mail_error');
    });
    mockSearchQuery(['mocked_customObject']);

    notifications.processNotifications();

    expect(global.request.setLocale).toHaveBeenLastCalledWith('en_US');
  });

  it('logs a warning when the locale of the order is not available on the site and still sends the confirmation email', () => {
    global.request.setLocale.mockReturnValueOnce(false);
    const order = buildOrder('nl_NL');
    objectsHandler.handle.mockReturnValue({
      status: 'mocked_ok',
      SubmitOrder: true,
      Order: order,
    });
    mockSearchQuery(['mocked_customObject']);

    notifications.processNotifications();

    expect(AdyenLogs.warning_log).toHaveBeenCalledWith(
      'Locale nl_NL is not available for the confirmation email of order mocked_orderNo',
    );
    expect(COHelpers.sendConfirmationEmail).toHaveBeenCalledWith(
      order,
      'nl_NL',
    );
  });

  it('logs a failing confirmation email and keeps processing the other notifications', () => {
    objectsHandler.handle.mockReturnValue({
      status: 'mocked_ok',
      SubmitOrder: true,
      Order: buildOrder('nl_NL'),
    });
    COHelpers.sendConfirmationEmail.mockImplementationOnce(() => {
      throw new Error('mocked_mail_error');
    });
    mockSearchQuery(['mocked_customObject_1', 'mocked_customObject_2']);

    notifications.processNotifications();

    expect(AdyenLogs.error_log).toHaveBeenCalledWith(
      'Failed to send the confirmation email for order mocked_orderNo',
      expect.any(Error),
    );
    expect(COHelpers.sendConfirmationEmail).toHaveBeenCalledTimes(2);
  });

  it('does not send a confirmation email when the order was not submitted', () => {
    objectsHandler.handle.mockReturnValue({
      status: 'mocked_ok',
      SubmitOrder: false,
      Order: buildOrder('nl_NL'),
    });
    mockSearchQuery(['mocked_customObject']);

    notifications.processNotifications();

    expect(COHelpers.sendConfirmationEmail).not.toHaveBeenCalled();
  });

  it('does not send a confirmation email for a skipped order', () => {
    objectsHandler.handle.mockReturnValue({
      status: 'mocked_ok',
      SubmitOrder: true,
      SkipOrder: true,
      Order: buildOrder('nl_NL'),
    });
    mockSearchQuery(['mocked_customObject']);

    notifications.processNotifications();

    expect(COHelpers.sendConfirmationEmail).not.toHaveBeenCalled();
  });

  it('does not send a confirmation email for a pending order', () => {
    objectsHandler.handle.mockReturnValue({
      status: 'mocked_ok',
      SubmitOrder: true,
      Pending: true,
      Order: buildOrder('nl_NL'),
    });
    mockSearchQuery(['mocked_customObject']);

    notifications.processNotifications();

    expect(COHelpers.sendConfirmationEmail).not.toHaveBeenCalled();
  });
});
