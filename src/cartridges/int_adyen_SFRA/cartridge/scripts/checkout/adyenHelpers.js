const Transaction = require('dw/system/Transaction');
const HookMgr = require('dw/system/HookMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const OrderMgr = require('dw/order/OrderMgr');
const PaymentInstrument = require('dw/order/PaymentInstrument');

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
  let result = {};
  if (order.totalNetPrice !== 0.0) {
    const paymentInstruments = order.paymentInstruments;

    if (paymentInstruments.length === 0) {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      result.error = true;
    }
    if (!result.error) {
      for (let i = 0; i < paymentInstruments.length; i++) {
        const paymentInstrument = paymentInstruments[i];
        const paymentProcessor = PaymentMgr.getPaymentMethod(
          paymentInstrument.paymentMethod,
        ).paymentProcessor;
        let authorizationResult;

        if (paymentProcessor === null) {
          Transaction.begin();
          paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
          Transaction.commit();
        } else {
          if (
            HookMgr.hasHook(
              `app.payment.processor.${paymentProcessor.ID.toLowerCase()}`,
            )
          ) {
            authorizationResult = HookMgr.callHook(
              `app.payment.processor.${paymentProcessor.ID.toLowerCase()}`,
              'Authorize',
              orderNumber,
              paymentInstrument,
              paymentProcessor,
            );
          } else {
            authorizationResult = HookMgr.callHook(
              'app.payment.processor.default',
              'Authorize',
            );
          }
          result = authorizationResult;
          if (authorizationResult.error) {
            Transaction.wrap(function () {
              OrderMgr.failOrder(order, true);
            });
            result.error = true;
            break;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
  const creditCardPaymentMethod = PaymentMgr.getPaymentMethod(
    PaymentInstrument.METHOD_CREDIT_CARD,
  );
  const paymentAmount = currentBasket.totalGrossPrice.value;
  const countryCode = req.geolocation.countryCode;
  const currentCustomer = req.currentCustomer.raw;
  const paymentInstruments = currentBasket.paymentInstruments;
  const result = {};

  const applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
    currentCustomer,
    countryCode,
    paymentAmount,
  );
  const applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
    currentCustomer,
    countryCode,
    paymentAmount,
  );

  let invalid = true;

  for (let i = 0; i < paymentInstruments.length; i++) {
    const paymentInstrument = paymentInstruments[i];
    if (
      PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(
        paymentInstrument.paymentMethod,
      )
    ) {
      invalid = false;
    }

    const paymentMethod = PaymentMgr.getPaymentMethod(
      paymentInstrument.getPaymentMethod(),
    );
    if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
      if (
        PaymentInstrument.METHOD_CREDIT_CARD.equals(
          paymentInstrument.paymentMethod,
        )
      ) {
        const card = PaymentMgr.getPaymentCard(
          paymentInstrument.creditCardType,
        );
        // Checks whether payment card is still applicable or if there is a credit card token set.
        if (
          (card && applicablePaymentCards.contains(card))
          || paymentInstrument.getCreditCardToken()
        ) {
          invalid = false;
        }
      } else {
        invalid = false;
      }
    }

    if (invalid) {
      break; // there is an invalid payment instrument
    }
  }

  result.error = invalid;
  return result;
}

module.exports = {
  handlePayments: handlePayments,
  validatePayment: validatePayment,
};
