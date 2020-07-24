global.dw = {
  order: {
    Order: {
      PAYMENT_STATUS_PAID: "MOCKED_PAID",
      EXPORT_STATUS_READY: "MOCKED_READY",
    },
  },
};
global.showStoreDetails = true;
global.$ = require("jquery");

global.request = { getLocale: jest.fn(() => "nl_NL") };
