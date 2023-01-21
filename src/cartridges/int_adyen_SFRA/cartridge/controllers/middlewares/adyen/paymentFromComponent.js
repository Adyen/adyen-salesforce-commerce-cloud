const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const Money = require('dw/value/Money');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const CustomerMgr = require('dw/customer/CustomerMgr');
const Logger = require('dw/system/Logger');

const expressMethods = ['applepay', 'amazonpay'];

function setBillingAndShippingAddress(reqDataObj, currentBasket) {
  const shopperDetails = reqDataObj.customer;

  let { billingAddress } = currentBasket;
  Transaction.wrap(() => {
    if (!billingAddress) {
      billingAddress = currentBasket.createBillingAddress();
    }
    billingAddress.setFirstName(shopperDetails.billingAddressDetails.firstName);
    billingAddress.setLastName(shopperDetails.billingAddressDetails.lastName);
    billingAddress.setPhone(shopperDetails.profile.phone);
    billingAddress.setAddress1(shopperDetails.billingAddressDetails.address1);
    billingAddress.setCity(shopperDetails.billingAddressDetails.city);
    billingAddress.setCountryCode(
      shopperDetails.billingAddressDetails.countryCode.value,
    );
    if (shopperDetails.billingAddressDetails.address2) {
      billingAddress.setAddress2(shopperDetails.billingAddressDetails.address2);
    }
  });

  let { shippingAddress } = currentBasket.getDefaultShipment();
  Transaction.wrap(() => {
    currentBasket.setCustomerEmail(shopperDetails.profile.email);
    if (!shippingAddress) {
      shippingAddress = currentBasket
        .getDefaultShipment()
        .createShippingAddress();
    }
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
    if (shopperDetails.addressBook.preferredAddress.address2) {
      shippingAddress.setAddress2(
        shopperDetails.addressBook.preferredAddress.address2,
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
  // Check if gift card was used
  const divideBy = AdyenHelper.getDivisorForCurrency(
    currentBasket.totalGrossPrice,
  );
  const parsedGiftCardObj = JSON.parse(session.privacy.giftCardResponse);
  const remainingAmount = {
    value: parsedGiftCardObj.remainingAmount.value,
    currency: parsedGiftCardObj.remainingAmount.currency,
  };
  const formattedAmount = new Money(
    remainingAmount.value,
    remainingAmount.currency,
  ).divide(divideBy);
  const mainPaymentInstrument = order.getPaymentInstruments(
    AdyenHelper.getOrderMainPaymentInstrumentType(order),
  )[0];
  // update amount from order total to PM total
  Transaction.wrap(() => {
    mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount);
  });

  const paidGiftcardAmount = {
    value: parsedGiftCardObj.value,
    currency: parsedGiftCardObj.currency,
  };
  const formattedGiftcardAmount = new Money(
    paidGiftcardAmount.value,
    paidGiftcardAmount.currency,
  ).divide(divideBy);
  Transaction.wrap(() => {
    const giftcardPM = order.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      formattedGiftcardAmount,
    );
    const { paymentProcessor } = PaymentMgr.getPaymentMethod(
      giftcardPM.paymentMethod,
    );
    giftcardPM.paymentTransaction.paymentProcessor = paymentProcessor;
    giftcardPM.custom.adyenPaymentMethod = parsedGiftCardObj.brand;
    giftcardPM.paymentTransaction.custom.Adyen_log =
      session.privacy.giftCardResponse;
    giftcardPM.paymentTransaction.custom.Adyen_pspReference =
      parsedGiftCardObj.giftCardpspReference;
  });
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

/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */
function paymentFromComponent(req, res, next) {
    try {
      Logger.getLogger('Adyen').error('inside paymentFromComponent');
      const reqDataObj = JSON.parse(req.form.data);
//      const shopperDetails = reqDataObj.shopperDetails;
//      Logger.getLogger('Adyen').error(' shopperDetails ' + JSON.stringify(shopperDetails));
      if (reqDataObj.cancelTransaction) {
        return handleCancellation(res, next, reqDataObj);
      }
      const currentBasket = BasketMgr.getCurrentBasket();
      let paymentInstrument;
      Transaction.wrap(() => {
        collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
          currentBasket.removePaymentInstrument(item);
        });

        paymentInstrument = currentBasket.createPaymentInstrument(
          constants.METHOD_ADYEN_COMPONENT,
          currentBasket.totalGrossPrice,
        );
        const { paymentProcessor } = PaymentMgr.getPaymentMethod(
          paymentInstrument.paymentMethod,
        );
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        paymentInstrument.custom.adyenPaymentData = req.form.data;

        if (reqDataObj.partialPaymentsOrder) {
          paymentInstrument.custom.adyenPartialPaymentsOrder =
            session.privacy.partialPaymentData;
        }
        paymentInstrument.custom.adyenPaymentMethod =
          AdyenHelper.getAdyenComponentType(req.form.paymentMethod);
      });

      if (reqDataObj.paymentType === 'express') {
        setBillingAndShippingAddress(reqDataObj, currentBasket);
      }

      let billingAddress = currentBasket.billingAddress;
      let shippingAddress = currentBasket.getDefaultShipment().shippingAddress;

//      var customer = CustomerMgr.getCustomerByCustomerNumber(
//          req.currentCustomer.profile.customerNo
//      );
//      var profile = customer.getProfile();
      var customer = req.currentCustomer;
//      var profile = customer.getProfile();

      Logger.getLogger('Adyen').error('customer ' + JSON.stringify(customer));
//      Logger.getLogger('Adyen').error('profile ' + profile);

        if(session.privacy.expressShopperDetails) {
            const shopperDetails = JSON.parse(session.privacy.expressShopperDetails)
        //      billingAddress.setAddress1(shopperDetails.billingAddress.addressLine1 || '');
              Transaction.wrap(function () {
              if (!shippingAddress) {
                shippingAddress = currentBasket.getDefaultShipment().createShippingAddress();
              }
              if (!billingAddress) {
              billingAddress = currentBasket.createBillingAddress();
              }
              billingAddress.setFirstName('Zaid');
              billingAddress.setFirstName(shopperDetails.billingAddress.name.split(' ')[0]);
              billingAddress.setLastName(shopperDetails.billingAddress.name.split(' ')[1] || shopperDetails.billingAddress.name.split(' ')[0]);
              billingAddress.setAddress1(shopperDetails.billingAddress.addressLine1 || '');
              billingAddress.setAddress2(shopperDetails.billingAddress.addressLine2 || '');
              billingAddress.setCity("Paris" || '');
              billingAddress.setPhone(shopperDetails.billingAddress.phoneNumber || '');
              billingAddress.setPostalCode(shopperDetails.billingAddress.postalCode || '');
              billingAddress.setStateCode(shopperDetails.billingAddress.stateOrRegion);
              billingAddress.setCountryCode("FR");

                shippingAddress.setFirstName(shopperDetails.shippingAddress.name.split(' ')[0]);
                shippingAddress.setLastName(shopperDetails.shippingAddress.name.split(' ')[1] || shopperDetails.billingAddress.name.split(' ')[0]);
                shippingAddress.setAddress1(shopperDetails.shippingAddress.addressLine1 || '');
                shippingAddress.setAddress2(shopperDetails.shippingAddress.addressLine2 || '');
                shippingAddress.setCity(shopperDetails.shippingAddress.city || '');
                shippingAddress.setPhone(shopperDetails.shippingAddress.phoneNumber || '');
                shippingAddress.setPostalCode(shopperDetails.shippingAddress.postalCode || '');
                shippingAddress.setStateCode(shopperDetails.shippingAddress.stateOrRegion);
                shippingAddress.setCountryCode(shopperDetails.shippingAddress.countryCode);

              currentBasket.setCustomerEmail(shopperDetails.buyer.email);
              });
        } else {
                      Transaction.wrap(function () {
                      if (!billingAddress) {
                      billingAddress = currentBasket.createBillingAddress();
                      }
                      billingAddress.setFirstName('Zaid');
                      });
        }

          Logger.getLogger('Adyen').error('about to create order');

      const order = COHelpers.createOrder(currentBasket);

      Logger.getLogger('Adyen').error('order ' + order);

      let result;
      Transaction.wrap(() => {
        result = adyenCheckout.createPaymentRequest({
          Order: order,
          PaymentInstrument: paymentInstrument,
        });
      });

      Logger.getLogger('Adyen').error('result ' + JSON.stringify(result));

      if (result.resultCode === constants.RESULTCODES.REFUSED) {
        handleRefusedResultCode(result, reqDataObj, order);
      }

            Logger.getLogger('Adyen').error('after refused ');

      // Check if gift card was used
      if (session.privacy.giftCardResponse) {
         handleGiftCardPayment(currentBasket, order);
      }

      result.orderNo = order.orderNo;
      result.orderToken = order.orderToken;
      res.json(result);
      return next();
    } catch(e) {
        Logger.getLogger('Adyen').error('inside catch ' + e.toString());
    }
}

module.exports = paymentFromComponent;
