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
 * @output RefusedHpp: Boolean Indicates that payment was made with using
 * Adyen method and was refused
 * @output Pending  : Boolean Indicates that payment is in pending status
 * @output SkipOrder  : Boolean Indicates that we should skip order,
 * order creation date > current date
 *
 */

const PaymentMgr = require('dw/order/PaymentMgr');
const Order = require('dw/order/Order');

//script includes
const constants = require('*/cartridge/adyenConstants/constants');
const adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function execute(args) {
  const result = handle(args.CustomObj);

  args.EventCode = result.EventCode;
  args.SubmitOrder = result.SubmitOrder;
  args.RefusedHpp = result.RefusedHpp;
  args.Pending = result.Pending;
  args.SkipOrder = result.SkipOrder;
  args.Order = result.Order;

  return result.status;
}
function handle(customObj) {
  const OrderMgr = require('dw/order/OrderMgr');
  const Transaction = require('dw/system/Transaction');
  let refusedHpp = false;
  let pending = false;
  const result = {};
  result.status = PIPELET_ERROR;

  result.EventCode = customObj.custom.eventCode;
  result.SubmitOrder = false;
  result.SkipOrder = false;

  // split order ID by - and remove last split (which is the date)
  const orderIdSplit = customObj.custom.orderId.split('-').slice(0, -1);
  const orderId = orderIdSplit.join('-');
  const order = OrderMgr.getOrder(orderId);
  result.Order = order;

  if (order === null) {
    // check to see if this was a $0.00 auth for recurring payment. if yes, CO can safely be deleted
    if (orderId.indexOf('recurringPayment') > -1) {
      result.SkipOrder = true;
      setProcessedCOInfo(customObj);
    } else {
      AdyenLogs.error_log(
        `Notification for not existing order ${customObj.custom.orderId} received.`,
      );
    }
    return result;
  }

  let isAdyen = false;
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
    switch (customObj.custom.eventCode) {
      case 'AUTHORISATION':
        const paymentInstruments = order.getPaymentInstruments();
        let adyenPaymentInstrument = null;
        // Move adyen log request to order payment transaction
        for (const pi in paymentInstruments) {
          if (
            [
              constants.METHOD_ADYEN,
              constants.METHOD_ADYEN_POS,
              constants.METHOD_ADYEN_COMPONENT,
            ].indexOf(paymentInstruments[pi].paymentMethod) !== -1 ||
            PaymentMgr.getPaymentMethod(
              paymentInstruments[pi].getPaymentMethod(),
            ).getPaymentProcessor().ID === 'ADYEN_CREDIT'
          ) {
            isAdyen = true;
            paymentInstruments[pi].paymentTransaction.custom.Adyen_log =
              customObj.custom.Adyen_log;
            adyenPaymentInstrument = paymentInstruments[pi];
          }
        }
        if (customObj.custom.success === 'true') {
          const amountPaid = parseFloat(order.custom.Adyen_value) + parseFloat(customObj.custom.value);
          const totalAmount = adyenHelper.getCurrencyValueForApi(adyenPaymentInstrument.getPaymentTransaction().getAmount()).value;
          if (order.paymentStatus.value === Order.PAYMENT_STATUS_PAID) {
            AdyenLogs.info_log(
			`Duplicate callback received for order ${order.orderNo}.`,
            );
          }
          else if(amountPaid < totalAmount) {
            order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
            AdyenLogs.info_log(
                `Partial amount ${customObj.custom.value} received for order number ${order.orderNo} with total amount ${totalAmount}`,
            );
          }
          else {
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            AdyenLogs.info_log(
				`Order ${order.orderNo} updated to status PAID.`,
            );
            result.SubmitOrder = true;
          }
          order.custom.Adyen_value = amountPaid.toString();
        } else {
          AdyenLogs.info_log(
            `Authorization for order ${order.orderNo} was not successful - no update.`,
          );
          // Determine if payment was refused and was used Adyen payment method
          if (
            !empty(reasonCode) &&
            (reasonCode === 'REFUSED' || reasonCode.indexOf('FAILED') > -1) &&
            isAdyen
          ) {
            refusedHpp = true;
          } else if (order.status.value === Order.ORDER_STATUS_FAILED) {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
            order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
          }
        }
        break;
      case 'CANCELLATION':
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.trackOrderChange('CANCELLATION notification received');
        AdyenLogs.info_log(
		`Order ${order.orderNo} was cancelled.`,
        );
        break;
      case 'CANCEL_OR_REFUND':
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.trackOrderChange('CANCEL_OR_REFUND notification received');
        AdyenLogs.info_log(
		`Order ${order.orderNo} was cancelled or refunded.`,
        );
        break;
      case 'REFUND':
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.trackOrderChange('REFUND notification received');
        AdyenLogs.info_log(
			`Order ${order.orderNo} was refunded.`,
        );
        break;
      // CustomAdyen
      case 'CAPTURE_FAILED':
        if (customObj.custom.success === 'true') {
          order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
          order.trackOrderChange('Capture failed, cancelling order');
          OrderMgr.cancelOrder(order);
        }
        AdyenLogs.info_log(
			`Capture Failed for order ${order.orderNo}`,
        );
        break;
      case 'ORDER_OPENED':
        if (customObj.custom.success === 'true') {
          AdyenLogs.info_log(
			`Order ${order.orderNo} opened for partial payments`,
          );
        }
        break;
      case 'ORDER_CLOSED':
        if (customObj.custom.success === 'true') {
          order.setExportStatus(Order.EXPORT_STATUS_READY);
          AdyenLogs.info_log(
			`Order ${order.orderNo} closed`,
          );
        }
        break;
      case 'OFFER_CLOSED':
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.trackOrderChange('Offer closed, failing order');
        Transaction.wrap(() => {
          OrderMgr.failOrder(order, false);
        });
        AdyenLogs.info_log(
			`Offer closed for order ${order.orderNo} and updated to status NOT PAID.`,
        );
        break;
      case 'PENDING':
        pending = true;
        AdyenLogs.info_log(
			`Order ${order.orderNo} was in pending status.`,
        );
        break;
      case 'CAPTURE':
        if (
          customObj.custom.success === 'true' &&
          order.status.value === Order.ORDER_STATUS_CANCELLED
        ) {
          order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
          order.setExportStatus(Order.EXPORT_STATUS_READY);
          order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
          OrderMgr.undoCancelOrder(order);
          AdyenLogs.info_log(
            `Undo failed capture, Order ${order.orderNo} updated to status PAID.`,
          );
        }

        break;
      default:
        AdyenLogs.info_log(
		`Order ${order.orderNo} received unhandled status ${customObj.custom.eventCode}`,
        );
    }

    // If payment was refused and was used Adyen payment method, the fields
    // are changed when user is redirected back from Adyen HPP
    if (!refusedHpp) {
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

      order.custom.Adyen_eventCode = customObj.custom.eventCode;

      // Add a note with all details
      order.addNote('Adyen Payment Notification', createLogMessage(customObj));
    }

    setProcessedCOInfo(customObj);
  } else {
    AdyenLogs.debug_log('Order date > current Date.');
    result.SkipOrder = true;
    result.status = PIPELET_NEXT;
    return result;
  }

  result.status = PIPELET_NEXT;
  result.RefusedHpp = refusedHpp;
  result.Pending = pending;

  return result;
}

function setProcessedCOInfo(customObj) {
  const now = new Date();
  customObj.custom.processedDate = now;
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
