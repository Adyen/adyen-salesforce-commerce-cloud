const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { placeOrder } = require('*/cartridge/utils/paymentUtils');
const { isWebhookSuccessful } = require('*/cartridge/utils/webhookUtils');
const constants = require('*/cartridge/utils/constants');
const collections = require('*/cartridge/scripts/util/collections');

/**
 * Handles duplicate callback when order is already paid
 * @param {dw.order.Order} order - The order object
 */
function handleDuplicateCallback(order) {
  AdyenLogs.info_log(`Duplicate callback received for order ${order.orderNo}.`);
}

/**
 * Handles partial payment scenario
 * @param {dw.order.Order} order - The order object
 * @param {Object} customObj - Custom object from webhook
 * @param {number} totalAmount - Total order amount
 */
function handlePartialPayment(order, customObj, totalAmount) {
  order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
  AdyenLogs.info_log(
    `Partial amount ${customObj.custom.value} received for order number ${order.orderNo} with total amount ${totalAmount}`,
  );
}

/**
 * Recovers a failed order when payment is successful
 * @param {dw.order.Order} order - The order object
 * @param {number} amountPaid - Amount paid
 * @param {number} totalAmount - Total order amount
 */
function handleFailedOrderRecovery(order, amountPaid, totalAmount) {
  if (
    order.status.value === Order.ORDER_STATUS_FAILED &&
    amountPaid === totalAmount
  ) {
    OrderMgr.undoFailOrder(order);
    order.trackOrderChange(
      'Authorisation webhook received for failed order, moving order status to CREATED',
    );
  }
}

/**
 * Handles successful authorization by placing order and updating status
 * @param {dw.order.Order} order - The order object
 * @param {Object} result - Result object to modify
 * @returns {boolean} True if order was successfully placed
 */
function handleSuccessfulAuthorisation(order, result) {
  const placeOrderResult = placeOrder(order);
  if (!placeOrderResult.error) {
    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
    order.setExportStatus(Order.EXPORT_STATUS_READY);
    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    AdyenLogs.info_log(`Order ${order.orderNo} updated to status PAID.`);
    result.SubmitOrder = true;
    return true;
  }
  return false;
}

/**
 * Handles failed authorization
 * @param {dw.order.Order} order - The order object
 */
function handleFailedAuthorisation(order) {
  AdyenLogs.info_log(
    `Authorization for order ${order.orderNo} was not successful - no update.`,
  );
  // Determine if payment was refused and was used Adyen payment method
  if (order.status.value === Order.ORDER_STATUS_FAILED) {
    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
    order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
  }
}

/**
 * Updates order with Adyen webhook data
 * @param {dw.order.Order} order - The order object
 * @param {Object} customObj - Custom object from webhook
 * @param {number} amountPaid - Amount paid
 */
function updateOrderWithAdyenData(order, customObj, amountPaid) {
  order.custom.Adyen_eventCode = customObj.custom.eventCode;
  order.custom.Adyen_value = amountPaid.toString();
}

/**
 * Handles CSC order properties
 * @param {dw.order.Order} order - The order object
 * @param {Object} customObj - Custom object from webhook
 */
function handleCSCOrderProperties(order, customObj) {
  if (order.custom.Adyen_serviceChannel === 'CSC') {
    order.custom.Adyen_pspReference = customObj.custom.pspReference;

    const { paymentMethod } = customObj.custom;
    order.custom.Adyen_paymentMethod = paymentMethod;
    collections.forEach(order.getPaymentInstruments(), (pi) => {
      pi.custom.adyenPaymentMethod = paymentMethod;
      pi.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method`] =
        paymentMethod;
      pi.custom.Adyen_Payment_Method_Variant = paymentMethod;
      pi.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method_Variant`] =
        paymentMethod;
    });
  }
}

/**
 * Main handler for AUTHORISATION webhook events
 * @param {Object} params - Handler parameters
 * @param {dw.order.Order} params.order - The order object
 * @param {Object} params.customObj - Custom object from webhook
 * @param {Object} params.result - Result object to modify
 * @param {number} params.totalAmount - Total order amount
 * @returns {Object} Handler result with success status
 */
function handle({ order, customObj, result, totalAmount }) {
  if (isWebhookSuccessful(customObj)) {
    const amountPaid = parseFloat(customObj.custom.value);
    const webhookData = JSON.parse(customObj.custom.Adyen_log);
    const fraudResultType = webhookData['additionalData.fraudResultType'];

    if (order.paymentStatus.value === Order.PAYMENT_STATUS_PAID) {
      handleDuplicateCallback(order);
    } else if (amountPaid < totalAmount) {
      handlePartialPayment(order, customObj, totalAmount);
    } else if (fraudResultType === constants.FRAUD_STATUS_AMBER) {
      order.trackOrderChange(
        'Order sent for manual review in Adyen Customer Area',
      );
    } else {
      handleCSCOrderProperties(order, customObj);
      handleFailedOrderRecovery(order, amountPaid, totalAmount);
      handleSuccessfulAuthorisation(order, result);
    }

    updateOrderWithAdyenData(order, customObj, amountPaid);
    return { success: true, isAdyenPayment: true };
  }
  handleFailedAuthorisation(order);
  return { success: false, isAdyenPayment: true };
}

module.exports = { handle, handleSuccessfulAuthorisation };
