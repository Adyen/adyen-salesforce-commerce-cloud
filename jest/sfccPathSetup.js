/* eslint-disable global-require */
// List of mocks to let node resolve SFCC cartridge paths
// int_adyen_SFRA mocks
jest.mock(
  '*/cartridge/adyen/scripts/index',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/index'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/redirect3ds1Response',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/redirect3ds1Response'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/adyen3d',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/adyen3d'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/adyen3ds2',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/adyen3ds2'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/paymentsDetails',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/paymentsDetails'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/webhooks/notify',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/webhooks/notify'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/paymentFromComponent',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/paymentFromComponent'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/checkBalance',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/checkBalance'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/cancelPartialPaymentOrder',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/cancelPartialPaymentOrder'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/models/cart',
  () => require('../cartridge/models/cart'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/models/shipping/shippingMethod',
  () => require('../cartridge/models/shipping/shippingMethod'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/partialPaymentsOrder',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/partialPaymentsOrder'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/partialPayment',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/partialPayment'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/shippingMethods',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/shippingMethods'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/paypal/makeExpressPaymentsCall',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/paypal/makeExpressPaymentsCall'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/paypal/makeExpressPaymentDetailsCall',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/paypal/makeExpressPaymentDetailsCall'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/paypal/saveShopperData',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/paypal/saveShopperData'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/paypal/handleCheckoutReview',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/paypal/handleCheckoutReview'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/fetchGiftCards',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/fetchGiftCards'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/saveExpressShopperDetails',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/saveExpressShopperDetails'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/getCheckoutPaymentMethods',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/getCheckoutPaymentMethods'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/showConfirmationPaymentFromComponent',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/showConfirmationPaymentFromComponent'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/handlePaymentFromComponent',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/handlePaymentFromComponent'),
  { virtual: true },
);

// middlewares/adyen/authorizeWithForm subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm/authorize',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/authorize'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm/error',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/error'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm/payment',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/payment'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm/order',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/order'),
  { virtual: true },
);

// middlewares/adyen/authorize3ds2 subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2/payment',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/payment'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2/auth',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/auth'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2/errorHandler',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/errorHandler'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2/order',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/order'),
  { virtual: true },
);

// middlewares/adyen/redirect subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/adyen/redirect',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/redirect'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/redirect/signature',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/redirect/signature'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/showConfirmation',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/showConfirmation'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/order',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/order'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/handlePayment',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/handlePayment'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/authorise',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/authorise'),
  { virtual: true },
);

// controllers/utils subclasses
jest.mock(
  '*/cartridge/controllers/utils/index',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/utils/index'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/clearForms',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/clearForms'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/validatePaymentData',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/validatePaymentData'),
  { virtual: true },
);

// controllers/middlewares/checkout_services subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/checkout_services/placeOrder',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/checkout_services/placeOrder'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/checkout_services/placeOrder',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/checkout_services/placeOrder'),
  { virtual: true },
);

// controllers/middlewares/checkout subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/checkout/index',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/checkout/index'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/checkout/begin',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/checkout/begin'),
  { virtual: true },
);

// controllers/middlewares/order subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/order/index',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/order/index'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/order/confirm',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/order/confirm'),
  { virtual: true },
);

// controllers/middlewares/payment_instruments subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/payment_instruments/index',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/index'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/payment_instruments/deletePayment',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/deletePayment'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/payment_instruments/paymentProcessorIDs',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/paymentProcessorIDs'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/payment_instruments/savePayment',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/savePayment'),
  { virtual: true },
);

// scripts/checkout subclasses
jest.mock(
  '*/cartridge/scripts/checkout/utils/index',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/checkout/utils/index'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/getPayments',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/getPayments'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/validatePaymentMethod',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/validatePaymentMethod'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/scripts/checkout/shippingHelpers',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/checkout/shippingHelpers'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/client/default/js/adyen_checkout/renderGiftcardComponent',
  () =>
    require('../src/cartridges/int_adyen_SFRA/client/default/js/adyen_checkout/renderGiftcardComponent'),
  { virtual: true },
);

// scripts/hooks/payment/processor/middlewares/authorize subclasses
jest.mock(
  '*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/authorize/paymentResponse',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/hooks/payment/processor/middlewares/authorize/paymentResponse'),
  { virtual: true },
);

// int_adyen_overlay mocks
jest.mock(
  '*/cartridge/adyen/config/constants',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/config/constants'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/config/paymentMethodDescriptions',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/config/paymentMethodDescriptions'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/riskDataHelper',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/riskDataHelper'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/lineItemHelper',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/lineItemHelper'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenGetOpenInvoiceData',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/adyenGetOpenInvoiceData'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData'),
  { virtual: true },
);

jest.mock(
	'*/cartridge/adyen/scripts/pos/getConnectedTerminals',
	() =>
	  require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/scripts/pos/getConnectedTerminals'),
	{ virtual: true },
  );

jest.mock(
  '*/cartridge/adyen/logs/adyenCustomLogs',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/logs/adyenCustomLogs'),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/giftCardsHelper',
  () =>
    require('../src/cartridges/int_adyen_SFRA/cartridge/adyen/utils/giftCardsHelper'),
  { virtual: true },
);
