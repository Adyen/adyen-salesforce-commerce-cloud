global.dw = {
  order: {
    Order: {
      PAYMENT_STATUS_PAID: 'MOCKED_PAID',
      EXPORT_STATUS_READY: 'MOCKED_READY',
    },
  },
};
global.showStoreDetails = true;
global.$ = require('jquery');

global.session = {
  privacy: { orderNo: 'mocked_orderNo' },
  forms: { billing: { clearFormElement: jest.fn() } },
  currency: { currencyCode: 'EUR' },
  sessionID: {
    slice: jest.fn().mockImplementation((start, end) => 'mocked_session_id'.substring(start, end)),
  },
};

global.request = { getLocale: jest.fn(() => 'nl_NL') };

global.customer = { profile: { customerNo: 'mocked_customerNo' } };

global.AdyenCheckout = () =>
  Promise.resolve({
    create: () => ({ mount: jest.fn() }),
    createFromAction: () => ({ mount: jest.fn() }),
  });
