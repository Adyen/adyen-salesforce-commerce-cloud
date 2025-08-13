/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen Salesforce Commerce Cloud
 * Copyright (c) 2021 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 *
 * Demandware Script File
 * where
 *   <paramUsageType> can be either 'input' or 'output'
 *   <paramName> can be any valid parameter name
 *   <paramDataType> identifies the type of the parameter
 *   <paramComment> is an optional comment
 *
 * For example:
 *
 * @input CustomObj : dw.object.CustomObject
 * @output Order: dw.order.Order The updated order
 * @output EventCode: String The event code
 * @output SubmitOrder: Boolean Submit order
 * @output Pending  : Boolean Indicates that payment is in pending status
 * @output SkipOrder  : Boolean Indicates that we should skip order,
 * order creation date > current date
 *
 */

const Order = require('dw/order/Order');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

// script includes
const adyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { handleAdyenPaymentInstruments } = require('./utils/paymentUtils');


function execute(args) {
  const result = handle(args.CustomObj);

  args.EventCode = result.EventCode;
  args.SubmitOrder = result.SubmitOrder;

  args.Pending = result.Pending;
  args.SkipOrder = result.SkipOrder;
  args.Order = result.Order;

  return result.status;
}

function handle(customObj) {
  const OrderMgr = require('dw/order/OrderMgr');
  const Transaction = require('dw/system/Transaction');

  let pending = false;
  const result = {};
  result.status = PIPELET_ERROR;

  result.EventCode = customObj.custom.eventCode;
  result.SubmitOrder = false;
  result.SkipOrder = false;

  // split order ID by - and remove last split (which is the date)
  const orderIdParts = customObj.custom.orderId.split('-');
  orderIdParts.pop();
  // in case the splitted array contains more than 1 element (DONATION case), get only the last split (which is the order number)
  const relevantOrderIdParts =
    orderIdParts.length > 1 ? orderIdParts.slice(-1) : orderIdParts;
  const orderId = relevantOrderIdParts.join('-');
  const order = OrderMgr.getOrder(orderId);
  result.Order = order;

  if (order === null) {
    // check to see if this was a $0.00 auth for recurring payment. if yes, CO can safely be deleted
    if (orderIdParts.indexOf('recurringPayment') > -1) {
      result.SkipOrder = true;
      setProcessedCOInfo(customObj);
    } else {
      AdyenLogs.error_log(
        `Notification for not existing order ${customObj.custom.orderId} received.`,
      );
    }
    return result;
  }

  const orderCreateDate = order.creationDate;
  const orderCreateDateDelay = createDelayOrderDate(orderCreateDate);
  const currentDate = new Date();
  const reasonCode =
    'reason' in customObj.custom && !empty(customObj.custom.reason)
      ? customObj.custom.reason.toUpperCase()
      : null;
  AdyenLogs.debug_log(
    `Order date ${orderCreateDate} , orderCreateDateDelay ${orderCreateDateDelay} , currentDate ${currentDate}`,
  );
  if (orderCreateDateDelay < currentDate) {
    const totalAmount = adyenHelper.getCurrencyValueForApi(
      order.getTotalGrossPrice(),
    ).value;
    
    // Check if one of the adyen payment methods was used during payment
    // Or if the payment method belongs to adyen payment processors
    const paymentInstruments = order.getPaymentInstruments();
    const isAdyenPayment = handleAdyenPaymentInstruments(paymentInstruments, customObj);
    
    // Handle all events using dedicated event handlers
    const handlerModule = require(`./eventHandlers/${customObj.custom.eventCode}`);
    if (handlerModule && typeof handlerModule.handle === 'function') {
      const handlerResult = handlerModule.handle({ order, customObj, result, totalAmount });
      // For PENDING events, capture the pending status
      if (customObj.custom.eventCode === 'PENDING' && handlerResult && handlerResult.pending) {
        pending = handlerResult.pending;
      }
    } else {
      // Handle unhandled event types
      AdyenLogs.info_log(
        `Order ${order.orderNo} received unhandled status ${customObj.custom.eventCode}`,
      );
    }
      // Add received information to order
      /*
        PSP Reference must be persistent.
        Some modification requests (Capture, Cancel) send identificators of the operations,
        we mustn't overwrite the original value by the new ones
      */
    if (
      empty(order.custom.Adyen_pspReference) &&
      !empty(customObj.custom.pspReference)
    ) {
      order.custom.Adyen_pspReference = customObj.custom.pspReference;
    }
    // Add a note with all details
    order.addNote('Adyen Payment Notification', createLogMessage(customObj));
    setProcessedCOInfo(customObj);
  } else {
    AdyenLogs.debug_log('Order date > current Date.');
    result.SkipOrder = true;
    result.status = PIPELET_NEXT;
    return result;
  }

  result.status = PIPELET_NEXT;
  result.Pending = pending;

  return result;
}

function setProcessedCOInfo(customObj) {
  customObj.custom.processedDate = new Date();
  customObj.custom.updateStatus = 'SUCCESS';
  customObj.custom.processedStatus = 'SUCCESS';
}

function createLogMessage(customObj) {
  const VERSION = customObj.custom.version;
  let msg = '';
  msg = `AdyenNotification v ${VERSION} - Payment info (Called from : ${customObj.custom.httpRemoteAddress})`;
  msg += '\n================================================================\n';
  // msg = msg + "\nSessionID : " + args.CurrentSession.sessionID;
  msg = `${msg}reason : ${customObj.custom.reason}`;
  msg = `${msg}\neventDate : ${customObj.custom.eventDate}`;
  msg = `${msg}\nmerchantReference : ${customObj.custom.merchantReference}`;
  msg = `${msg}\ncurrency : ${customObj.custom.currency}`;
  msg = `${msg}\npspReference : ${customObj.custom.pspReference}`;
  msg = `${msg}\nmerchantAccountCode : ${customObj.custom.merchantAccountCode}`;
  msg = `${msg}\neventCode : ${customObj.custom.eventCode}`;
  msg = `${msg}\nvalue : ${customObj.custom.value}`;
  msg = `${msg}\noperations : ${customObj.custom.operations}`;
  msg = `${msg}\nsuccess : ${customObj.custom.success}`;
  msg = `${msg}\npaymentMethod : ${customObj.custom.paymentMethod}`;
  msg = `${msg}\nlive : ${customObj.custom.live}`;
  return msg;
}

function createDelayOrderDate(orderCreateDate) {
  // AdyenNotificationDelayMinutes
  const adyenDelayMin = 1;

  // Variable in milliseconds
  const newDate = new Date();
  newDate.setTime(orderCreateDate.getTime() + adyenDelayMin * 60 * 1000);
  return newDate;
}

module.exports = {
  execute,
  handle,
};
