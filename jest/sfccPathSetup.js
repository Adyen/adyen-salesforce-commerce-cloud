const path = require('path');

const mockCartridgesRoot =
    process.env.SFCC_TEST_TARGET === 'transpiled'
        ? path.resolve(__dirname, '../cartridges')
        : path.resolve(__dirname, '../src/cartridges');

/* eslint-disable global-require */
// List of mocks to let node resolve SFCC cartridge paths
// int_adyen_SFRA mocks
jest.mock(
  '*/cartridge/adyen/scripts/index',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/index`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/redirect3ds1Response',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/payments/redirect3ds1Response`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/adyen3d',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/adyen3d`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/adyen3ds2',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/adyen3ds2`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/paymentsDetails',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/payments/paymentsDetails`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/notify',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_webhooks/cartridge/notify`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/paymentFromComponent',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/payments/paymentFromComponent`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/checkBalance',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/checkBalance`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/cancelPartialPaymentOrder',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/cancelPartialPaymentOrder`),
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
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/partialPaymentsOrder`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/partialPayment',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/partialPayment`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/shippingMethods',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/shippingMethods`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/paypal/makeExpressPaymentsCall',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/paypal/makeExpressPaymentsCall`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/paypal/makeExpressPaymentDetailsCall',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/paypal/makeExpressPaymentDetailsCall`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/paypal/saveShopperData',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/paypal/saveShopperData`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/paypal/handleCheckoutReview',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/paypal/handleCheckoutReview`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/fetchGiftCards',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/fetchGiftCards`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/partialPayments/getBasketAmount',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/partialPayments/getBasketAmount`),
  { virtual: true },
);

jest.mock(
	'*/cartridge/adyen/scripts/donations/adyenGiving',
	() =>
	  require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/donations/adyenGiving`),
	{ virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/saveExpressShopperDetails',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/saveExpressShopperDetails`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/getCheckoutPaymentMethods',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/payments/getCheckoutPaymentMethods`),
  { virtual: true },
);

jest.mock(
	'*/cartridge/adyen/scripts/expressPayments/getCheckoutExpressPaymentMethods',
	() =>
		require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/getCheckoutExpressPaymentMethods`),
	{ virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/showConfirmationPaymentFromComponent',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/showConfirmationPaymentFromComponent`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/handlePaymentFromComponent',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/handlePaymentFromComponent`),
  { virtual: true },
);

// middlewares/adyen/authorizeWithForm subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm/authorize',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/authorize`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm/error',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/error`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm/payment',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/payment`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorizeWithForm/order',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorizeWithForm/order`),
  { virtual: true },
);

// middlewares/adyen/authorize3ds2 subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2/payment',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/payment`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2/auth',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/auth`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2/errorHandler',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/errorHandler`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/authorize3ds2/order',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/authorize3ds2/order`),
  { virtual: true },
);

// middlewares/adyen/redirect subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/adyen/redirect',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/redirect`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/adyen/redirect/signature',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/adyen/redirect/signature`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/showConfirmation',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/showConfirmation`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/order',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/order`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/handlePayment',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/handlePayment`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/showConfirmation/authorise',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/showConfirmation/authorise`),
  { virtual: true },
);

// controllers/utils subclasses
jest.mock(
  '*/cartridge/controllers/utils/index',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/utils/index`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/clearForms',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/clearForms`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/validatePaymentData',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/validatePaymentData`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/checkoutRequestSanitizer',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/checkoutRequestSanitizer`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/localeHelper',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/localeHelper`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/dcapHelper',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/dcapHelper`),
  { virtual: true },
);

// controllers/middlewares/checkout_services subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/checkout_services/placeOrder',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/checkout_services/placeOrder`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/checkout_services/placeOrder',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/checkout_services/placeOrder`),
  { virtual: true },
);

// controllers/middlewares/checkout subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/checkout/index',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/checkout/index`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/checkout/begin',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/checkout/begin`),
  { virtual: true },
);

// controllers/middlewares/order subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/order/index',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/order/index`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/order/confirm',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/order/confirm`),
  { virtual: true },
);

// controllers/middlewares/payment_instruments subclasses
jest.mock(
  '*/cartridge/controllers/middlewares/payment_instruments/index',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/index`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/payment_instruments/deletePayment',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/deletePayment`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/payment_instruments/paymentProcessorIDs',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/paymentProcessorIDs`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/payment_instruments/savePayment',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/controllers/middlewares/payment_instruments/savePayment`),
  { virtual: true },
);

// scripts/checkout subclasses
jest.mock(
  '*/cartridge/scripts/checkout/utils/index',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/checkout/utils/index`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/getPayments',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/getPayments`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/validatePaymentMethod',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/validatePaymentMethod`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/scripts/checkout/shippingHelpers',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/checkout/shippingHelpers`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/client/default/js/adyen_checkout/giftcards',
  () =>
    require(`${mockCartridgesRoot}/app_adyen_SFRA/cartridge/client/default/js/adyen_checkout/giftcards`),
  { virtual: true },
);

// scripts/hooks/payment/processor/middlewares/authorize subclasses
jest.mock(
  '*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/authorize/paymentResponse',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/hooks/payment/processor/middlewares/authorize/paymentResponse`),
  { virtual: true },
);

// int_adyen_overlay mocks
jest.mock(
  '*/cartridge/adyen/config/constants',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/config/constants`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/config/card-type-mapping.json',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/config/card-type-mapping.json`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/config/paymentMethodDescriptions',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/config/paymentMethodDescriptions`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/riskDataHelper',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/riskDataHelper`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/lineItemHelper',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/lineItemHelper`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenGetOpenInvoiceData',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/payments/adyenGetOpenInvoiceData`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/pos/getConnectedTerminals',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/pos/getConnectedTerminals`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/logs/adyenCustomLogs',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/logs/adyenCustomLogs`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/giftCardsHelper',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/giftCardsHelper`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/paypal/saveExpressPaymentData',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/paypal/saveExpressPaymentData`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/expressPayments/calculatePrice',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/expressPayments/calculatePrice`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/analytics/analyticsService',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/analytics/analyticsService`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/analytics/constants',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/analytics/constants`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/logs/adyenError',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/logs/adyenError`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/logs/setErrorType',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/logs/setErrorType`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/hooks/payment/preAuthorizationHandling',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/hooks/payment/preAuthorizationHandling`),
  { virtual: true },
);

// int_adyen_webhooks mocks
jest.mock(
  '*/cartridge/utils/paymentUtils',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_webhooks/cartridge/utils/paymentUtils`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/hooks/payment/postAuthorizationHandling',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/scripts/hooks/payment/postAuthorizationHandling`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/utils/webhookUtils',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_webhooks/cartridge/utils/webhookUtils`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/utils/constants',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_webhooks/cartridge/utils/constants`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/utils/customObjectHelper',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_webhooks/cartridge/utils/customObjectHelper`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/eventHandlers/AUTHORISATION',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_webhooks/cartridge/eventHandlers/AUTHORISATION`),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/utils/klarnaHelper',
  () =>
    require(`${mockCartridgesRoot}/int_adyen_SFRA/cartridge/adyen/utils/klarnaHelper`),
  { virtual: true },
);
