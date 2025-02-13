const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const Money = require('dw/value/Money');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const constants = require('*/cartridge/adyen/config/constants');
const collections = require('*/cartridge/scripts/util/collections');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const GiftCardsHelper = require('*/cartridge/adyen/utils/giftCardsHelper');

const expressMethods = [
  constants.PAYMENTMETHODS.APPLEPAY,
  constants.PAYMENTMETHODS.AMAZONPAY,
  constants.PAYMENTMETHODS.GOOGLEPAY,
];

function setBillingAndShippingAddress(reqDataObj, currentBasket) {
  let { billingAddress } = currentBasket;
  let { shippingAddress } = currentBasket.getDefaultShipment();
  Transaction.wrap(() => {
    if (!shippingAddress) {
      shippingAddress = currentBasket
        .getDefaultShipment()
        .createShippingAddress();
    }
    if (!billingAddress) {
      billingAddress = currentBasket.createBillingAddress();
    }
  });

  const shopperDetails = reqDataObj.customer;

  Transaction.wrap(() => {
    billingAddress.setFirstName(shopperDetails.billingAddressDetails.firstName);
    billingAddress.setLastName(shopperDetails.billingAddressDetails.lastName);
    billingAddress.setPhone(shopperDetails.profile.phone);
    billingAddress.setAddress1(shopperDetails.billingAddressDetails.address1);
    billingAddress.setCity(shopperDetails.billingAddressDetails.city);
    billingAddress.setCountryCode(
      shopperDetails.billingAddressDetails.countryCode.value,
    );
    billingAddress.setPostalCode(
      shopperDetails.billingAddressDetails.postalCode,
    );
    if (shopperDetails.billingAddressDetails.address2) {
      billingAddress.setAddress2(shopperDetails.billingAddressDetails.address2);
    }
    if (shopperDetails.billingAddressDetails.stateCode) {
      billingAddress.setStateCode(
        shopperDetails.billingAddressDetails.stateCode,
      );
    }

    currentBasket.setCustomerEmail(shopperDetails.profile.email);
    shippingAddress.setFirstName(shopperDetails.profile.firstName);
    shippingAddress.setLastName(shopperDetails.profile.lastName);
    shippingAddress.setPhone(shopperDetails.profile.phone);
    shippingAddress.setAddress1(
      shopperDetails.addressBook.preferredAddress.address1,
    );
    shippingAddress.setCity(shopperDetails.addressBook.preferredAddress.city);
    shippingAddress.setCountryCode(
      shopperDetails.addressBook.preferredAddress.countryCode.value,
    );
    shippingAddress.setPostalCode(
      shopperDetails.addressBook.preferredAddress.postalCode,
    );
    if (shopperDetails.addressBook.preferredAddress.address2) {
      shippingAddress.setAddress2(
        shopperDetails.addressBook.preferredAddress.address2,
      );
    }
    if (shopperDetails.addressBook.preferredAddress.stateCode) {
      shippingAddress.setStateCode(
        shopperDetails.addressBook.preferredAddress.stateCode,
      );
    }
  });
}

function failOrder(order) {
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
}

function handleGiftCardPayment(currentBasket, order) {
  const giftCards = currentBasket.custom?.adyenGiftCards
    ? JSON.parse(currentBasket.custom.adyenGiftCards)
    : null;
  if (giftCards) {
    const mainPaymentInstrument = order.getPaymentInstruments(
      AdyenHelper.getOrderMainPaymentInstrumentType(order),
    )[0];
    giftCards.forEach((giftCard) => {
      const divideBy = AdyenHelper.getDivisorForCurrency(
        mainPaymentInstrument.paymentTransaction.getAmount(),
      );
      const amount = {
        value: giftCard.remainingAmount.value,
        currency: giftCard.remainingAmount.currency,
      };
      const formattedAmount = new Money(amount.value, amount.currency).divide(
        divideBy,
      );
      Transaction.wrap(() => {
        mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount);
      });
      GiftCardsHelper.createGiftCardPaymentInstrument(
        giftCard,
        divideBy,
        order,
      );
    });
  }
}

function handleCancellation(res, next, reqDataObj) {
  AdyenLogs.info_log(
    `Shopper cancelled paymentFromComponent transaction for order ${reqDataObj.merchantReference}`,
  );

  const order = OrderMgr.getOrder(
    reqDataObj.merchantReference,
    reqDataObj.orderToken,
  );
  failOrder(order);
  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
  return next();
}

function handleRefusedResultCode(result, reqDataObj, order) {
  AdyenLogs.error_log(`Payment refused for order ${order.orderNo}`);
  result.paymentError = true;

  // Decline flow for Amazonpay or Applepay is handled different from other Component PMs
  // Order needs to be failed here to handle decline flow.
  if (expressMethods.indexOf(reqDataObj.paymentMethod) > -1) {
    failOrder(order);
  }
}

function isExpressPayment(reqDataObj) {
  return reqDataObj.paymentType === 'express';
}

function handleExpressPayment(reqDataObj, currentBasket) {
  if (isExpressPayment(reqDataObj)) {
    setBillingAndShippingAddress(reqDataObj, currentBasket);
  }
}

function canSkipSummaryPage(reqDataObj) {
  if (
    constants.CAN_SKIP_SUMMARY_PAGE.indexOf(reqDataObj.paymentMethod?.type) >= 0
  ) {
    return true;
  }

  return false;
}

/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */
function paymentFromComponent(req, res, next) {
  const { isExpressPdp, ...reqDataObj } = JSON.parse(req.form.data);
  if (reqDataObj.cancelTransaction) {
    return handleCancellation(res, next, reqDataObj);
  }
  const currentBasket = isExpressPdp
    ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId)
    : BasketMgr.getCurrentBasket();
  let paymentInstrument;
  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
      currentBasket.removePaymentInstrument(item);
    });

    const paymentInstrumentType = constants.METHOD_ADYEN_COMPONENT;

    paymentInstrument = currentBasket.createPaymentInstrument(
      paymentInstrumentType,
      currentBasket.totalGrossPrice,
    );
    const { paymentProcessor } = PaymentMgr.getPaymentMethod(
      paymentInstrument.paymentMethod,
    );
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenMainPaymentInstrument = paymentInstrumentType;
    paymentInstrument.custom.adyenPaymentData = req.form.data;

    if (session.privacy.partialPaymentData) {
      paymentInstrument.custom.adyenPartialPaymentsOrder =
        session.privacy.partialPaymentData;
    }
    paymentInstrument.custom.adyenPaymentMethod =
      AdyenHelper.getAdyenComponentType(req.form.paymentMethod);
    paymentInstrument.custom[
      `${constants.OMS_NAMESPACE}__Adyen_Payment_Method`
    ] = AdyenHelper.getAdyenComponentType(req.form.paymentMethod);
    paymentInstrument.custom.Adyen_Payment_Method_Variant =
      req.form.paymentMethod.toLowerCase();
    paymentInstrument.custom[
      `${constants.OMS_NAMESPACE}__Adyen_Payment_Method_Variant`
    ] = req.form.paymentMethod.toLowerCase();
  });

  handleExpressPayment(reqDataObj, currentBasket);

  let order;
  // Check if gift card was used
  if (currentBasket.custom?.adyenGiftCards) {
    const giftCardsOrderNo = currentBasket.custom.adyenGiftCardsOrderNo;
    order = OrderMgr.createOrder(currentBasket, giftCardsOrderNo);
  } else {
    order = COHelpers.createOrder(currentBasket);
  }
  session.privacy.orderNo = order.orderNo;

  let result;
  Transaction.wrap(() => {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
    });
  });

  currentBasket.custom.amazonExpressShopperDetails = null;
  currentBasket.custom.adyenGiftCardsOrderNo = null;

  if (result.resultCode === constants.RESULTCODES.REFUSED) {
    handleRefusedResultCode(result, reqDataObj, order);
  }

  handleGiftCardPayment(currentBasket, order);

  // Check if summary page can be skipped in case payment is already authorized
  result.skipSummaryPage = canSkipSummaryPage(reqDataObj);

  result.orderNo = order.orderNo;
  result.orderToken = order.orderToken;
  res.json(result);
  return next();
}

module.exports = paymentFromComponent;
