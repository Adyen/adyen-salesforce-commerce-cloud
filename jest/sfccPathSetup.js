// List of mocks to let node resolve SFCC cartridge paths

// int_adyen_SFRA mocks
jest.mock('*/cartridge/controllers/middlewares/adyen/index', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/index');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/redirect3ds1Response', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/redirect3ds1Response');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/adyen3d', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/adyen3d');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/adyen3ds2', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/adyen3ds2');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/paymentsDetails', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/paymentsDetails');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/notify', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/notify');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/sessions', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/sessions');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/paymentFromComponent', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/paymentFromComponent');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/checkBalance', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/checkBalance');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/cancelPartialPaymentOrder', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/cancelPartialPaymentOrder');
}, {virtual: true});

jest.mock('*/cartridge/models/cart', () => {
  return require('../cartridge/models/cart');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/partialPaymentsOrder', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/partialPaymentsOrder');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/partialPayment', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/partialPayment');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/shippingMethods', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/shippingMethods');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/shippingMethods', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/selectShippingMethods');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/fetchGiftCards', () => {
	return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/fetchGiftCards');
  }, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/saveExpressShopperDetails', () => {
	return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/saveExpressShopperDetails');
  }, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/getCheckoutPaymentMethods', () => {
	return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/getCheckoutPaymentMethods');
  }, {virtual: true});

// middlewares/adyen/showConfirmationPaymentFromComponent subclasses
jest.mock('*/cartridge/controllers/middlewares/adyen/showConfirmationPaymentFromComponent', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/showConfirmationPaymentFromComponent');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/showConfirmationPaymentFromComponent/payment', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/showConfirmationPaymentFromComponent/payment');
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

// middlewares/adyen/showConfirmation subclasses
jest.mock('*/cartridge/controllers/middlewares/adyen/showConfirmation', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/showConfirmation');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/showConfirmation/order', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/showConfirmation/order');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
}, {virtual: true});

jest.mock('*/cartridge/controllers/middlewares/adyen/showConfirmation/authorise', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/showConfirmation/authorise');
}, {virtual: true});

// controllers/utils subclasses
jest.mock('*/cartridge/controllers/utils/index', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/utils/index');
}, {virtual: true});

jest.mock('*/cartridge/controllers/utils/clearForms', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/utils/clearForms');
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
  return require('../src/cartridges/int_adyen_SFRA/cartridge/scripts/checkout/utils/index');
}, {virtual: true});

jest.mock('*/cartridge/scripts/checkout/utils/getPayments', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/scripts/checkout/utils/getPayments');
}, {virtual: true});

jest.mock('*/cartridge/scripts/checkout/utils/validatePaymentMethod', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/scripts/checkout/utils/validatePaymentMethod');
}, {virtual: true});

jest.mock('*/cartridge/scripts/checkout/shippingHelpers', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/scripts/checkout/shippingHelpers');
}, {virtual: true});

// scripts/hooks/payment/processor/middlewares/authorize subclasses
jest.mock('*/cartridge/scripts/hooks/payment/processor/middlewares/authorize/paymentResponse', () => {
  return require('../src/cartridges/int_adyen_SFRA/cartridge/scripts/hooks/payment/processor/middlewares/authorize/paymentResponse');
}, {virtual: true});

// int_adyen_overlay mocks
jest.mock('*/cartridge/adyenConstants/constants', () => {
  return require('../src/cartridges/int_adyen_overlay/cartridge/adyenConstants/constants');
}, {virtual: true});

jest.mock('*/cartridge/adyenConstants/paymentMethodDescriptions', () => {
  return require('../src/cartridges/int_adyen_overlay/cartridge/adyenConstants/paymentMethodDescriptions');
}, {virtual: true});

jest.mock('*/cartridge/scripts/util/riskDataHelper', () => {
  return require('../src/cartridges/int_adyen_overlay/cartridge/scripts/util/riskDataHelper');
}, {virtual: true});

jest.mock('*/cartridge/scripts/util/lineItemHelper', () => {
  return require('../src/cartridges/int_adyen_overlay/cartridge/scripts/util/lineItemHelper');
}, {virtual: true});

jest.mock('*/cartridge/scripts/adyenGetOpenInvoiceData', () => {
  return require('../src/cartridges/int_adyen_overlay/cartridge/scripts/adyenGetOpenInvoiceData');
}, {virtual: true});

jest.mock('*/cartridge/scripts/adyenLevelTwoThreeData', () => {
  return require('../src/cartridges/int_adyen_overlay/cartridge/scripts/adyenLevelTwoThreeData');
}, {virtual: true});

jest.mock('*/cartridge/scripts/adyenCustomLogs', () => {
	return require('../src/cartridges/int_adyen_overlay/cartridge/scripts/adyenCustomLogs');
  }, {virtual: true});