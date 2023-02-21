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
};

global.request = { getLocale: jest.fn(() => 'nl_NL') };

global.customer = { profile: { customerNo: 'mocked_customerNo' } };

global.AdyenCheckout = () => {
  return Promise.resolve({
    create: () => {
      return { mount: jest.fn() };
    }
  });
};