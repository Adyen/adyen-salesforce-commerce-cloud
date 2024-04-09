// List of mocks to let node resolve SFCC cartridge paths

// int_adyen_SFRA mocks
jest.mock('*/cartridge/adyen/scripts/index', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/index');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/payments/redirect3ds1Response', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/redirect3ds1Response');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/adyen3d', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/adyen3d');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/adyen3ds2', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/adyen3ds2');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/payments/paymentsDetails', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/paymentsDetails');
}, {virtual: true});

jest.mock('*/cartridge/adyen/webhooks/notify', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/webhooks/notify');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/payments/paymentFromComponent', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/paymentFromComponent');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/partialPayments/checkBalance', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/checkBalance');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/partialPayments/cancelPartialPaymentOrder', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/cancelPartialPaymentOrder');
}, {virtual: true});

jest.mock('*/cartridge/models/cart', () => {
  return require('../cartridge/models/cart');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/partialPayments/partialPaymentsOrder', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/partialPaymentsOrder');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/partialPayments/partialPayment', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/partialPayment');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/expressPayments/shippingMethods', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/shippingMethods');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/partialPayments/fetchGiftCards', () => {
	return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/fetchGiftCards');
  }, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/expressPayments/saveExpressShopperDetails', () => {
	return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/saveExpressShopperDetails');
  }, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/payments/getCheckoutPaymentMethods', () => {
	return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/getCheckoutPaymentMethods');
  }, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/showConfirmation/showConfirmationPaymentFromComponent', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/showConfirmationPaymentFromComponent');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/showConfirmation/handlePaymentFromComponent', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/handlePaymentFromComponent');
}, {virtual: true});

// middlewares/adyen/authorizeWithForm subclasses
jest.mock('*/cartridge/controllers/middlewares/adyen/authorizeWithForm', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/authorizeWithForm/authorize', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/authorize');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/authorizeWithForm/error', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/error');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/authorizeWithForm/payment', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/payment');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/authorizeWithForm/order', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/order');
}, {virtual: true});

// middlewares/adyen/authorize3ds2 subclasses
jest.mock('*/cartridge/controllers/middlewares/adyen/authorize3ds2', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/authorize3ds2/payment', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/payment');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/authorize3ds2/auth', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/auth');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/authorize3ds2/errorHandler', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/errorHandler');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/authorize3ds2/order', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/order');
}, {virtual: true});

// middlewares/adyen/redirect subclasses
jest.mock('*/cartridge/controllers/middlewares/adyen/redirect', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/redirect');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/redirect/signature', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/redirect/signature');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/showConfirmation/showConfirmation', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/showConfirmation');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/showConfirmation/order', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/order');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/showConfirmation/handlePayment', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/handlePayment');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/showConfirmation/authorise', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/authorise');
}, {virtual: true});

// controllers/utils subclasses
jest.mock('*/cartridge/controllers/utils/index', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/utils/index');
}, {virtual: true});

jest.mock('*/cartridge/adyen/utils/clearForms', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/clearForms');
}, {virtual: true});

// controllers/middlewares/checkout_services subclasses
jest.mock('*/cartridge/controllers/middlewares/checkout_services/placeOrder', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/checkout_services/placeOrder');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/checkout_services/placeOrder', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/checkout_services/placeOrder');
}, {virtual: true});

// controllers/middlewares/checkout subclasses
jest.mock('*/cartridge/controllers/middlewares/checkout/index', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/checkout/index');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/checkout/begin', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/checkout/begin');
}, {virtual: true});

// controllers/middlewares/order subclasses
jest.mock('*/cartridge/controllers/middlewares/order/index', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/order/index');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/order/confirm', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/order/confirm');
}, {virtual: true});

// controllers/middlewares/payment_instruments subclasses
jest.mock('*/cartridge/controllers/middlewares/payment_instruments/index', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/index');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/payment_instruments/deletePayment', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/deletePayment');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/payment_instruments/paymentProcessorIDs', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/paymentProcessorIDs');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/payment_instruments/savePayment', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/savePayment');
}, {virtual: true});

// scripts/checkout subclasses
jest.mock('*/cartridge/scripts/checkout/utils/index', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/checkout/utils/index');
}, {virtual: true});

jest.mock('*/cartridge/adyen/utils/getPayments', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/getPayments');
}, {virtual: true});

jest.mock('*/cartridge/adyen/utils/validatePaymentMethod', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/validatePaymentMethod');
}, {virtual: true});

jest.mock('*/cartridge/scripts/checkout/shippingHelpers', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/checkout/shippingHelpers');
}, {virtual: true});

jest.mock('*/cartridge/client/default/js/adyen_checkout/renderGiftcardComponent', () => {
  return require('../src/cartridges/int_adyen_SFRA/client/default/js/adyen_checkout/renderGiftcardComponent');
}, {virtual: true});

// scripts/hooks/payment/processor/middlewares/authorize subclasses
jest.mock('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/authorize/paymentResponse', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/hooks/payment/processor/middlewares/authorize/paymentResponse');
}, {virtual: true});

// int_adyen_overlay mocks
jest.mock('*/cartridge/adyen/config/constants', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/config/constants');
}, {virtual: true});

jest.mock('*/cartridge/adyen/config/paymentMethodDescriptions', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/config/paymentMethodDescriptions');
}, {virtual: true});

jest.mock('*/cartridge/adyen/utils/riskDataHelper', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/riskDataHelper');
}, {virtual: true});

jest.mock('*/cartridge/adyen/utils/lineItemHelper', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/lineItemHelper');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/payments/adyenGetOpenInvoiceData', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/adyenGetOpenInvoiceData');
}, {virtual: true});

jest.mock('*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData');
}, {virtual: true});

jest.mock('*/cartridge/adyen/logs/adyenCustomLogs', () => {
	return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/logs/adyenCustomLogs');
  }, {virtual: true});

jest.mock('*/cartridge/adyen/utils/giftCardsHelper', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/giftCardsHelper');
}, {virtual: true});