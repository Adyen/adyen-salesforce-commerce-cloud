/*
 * Script to run Adyen notification related jobs
 */

/* API Includes */
// eslint-disable-next-line no-unused-vars
const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
// eslint-disable-next-line no-unused-vars
const Resource = require('dw/web/Resource');
// eslint-disable-next-line no-unused-vars
const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');

function execute(pdict) {
  processNotifications(pdict);
  clearNotifications(pdict);
  return PIPELET_NEXT;
}

/**
 * ProcessNotifications - search for custom objects that need to be processed and handle them to place or fail order
 */
function processNotifications(/* pdict */) {
  const objectsHandler = require('*/cartridge/scripts/handleCustomObject');
  const searchQuery = CustomObjectMgr.queryCustomObjects(
    'adyenNotification',
    "custom.updateStatus = 'PROCESS'",
    null,
  );
  logger.info('Process notifications start with count {0}', searchQuery.count);

  let customObj; let handlerResult; let
    order;
  while (searchQuery.hasNext()) {
    customObj = searchQuery.next();
    Transaction.wrap(function () { // eslint-disable-line no-loop-func
      handlerResult = objectsHandler.handle(customObj);
    });

    /*
			Sometimes order cannot be found in DWRE DB even if it exists there,
			in that case we shouldn't reply to Adyen that all was ok in order to get a new notification
		*/

    order = handlerResult.Order;
    if (!handlerResult.status || handlerResult.status === PIPELET_ERROR) {
      // Only CREATED orders can be failed
      if (
        order === null
        || order.status !== dw.order.Order.ORDER_STATUS_CREATED
        || handlerResult.RefusedHpp
      ) {
        continue;
      }
      // Refused payments which are made with using Adyen payment method are handled when user is redirected back from Adyen HPP.
      // Here we shouldn't fail an order and send a notification
      Transaction.wrap(function () { // eslint-disable-line no-loop-func
        OrderMgr.failOrder(order, true);
      });
      continue;
    }

    if (handlerResult.SkipOrder || handlerResult.Pending) {
      continue;
    }

    // Submitting an order -> update status and send all required email
    if (handlerResult.SubmitOrder) {
      const placeOrderResult = submitOrder(order);
      if (!placeOrderResult.order_created || placeOrderResult.error) {
        logger.error(
          'Failed to place an order: {0}, during notification process.',
          order.orderNo,
        );
      }
    }
  }
  logger.info(
    'Process notifications finished with count {0}',
    searchQuery.count,
  );
  searchQuery.close();

  return PIPELET_NEXT;
}

/**
 * cleanNotifications
 */
function clearNotifications(/* pdict */) {
  const deleteCustomObjects = require('*/cartridge/scripts/deleteCustomObjects');
  const searchQuery = CustomObjectMgr.queryCustomObjects(
    'adyenNotification',
    "custom.processedStatus = 'SUCCESS'",
    null,
  );
  logger.info(
    'Removing Processed Custom Objects start with count {0}',
    searchQuery.count,
  );

  let customObj;
  while (searchQuery.hasNext()) {
    customObj = searchQuery.next();
    Transaction.wrap(function () { // eslint-disable-line no-loop-func
      deleteCustomObjects.remove(customObj);
    });
  }
  logger.info(
    'Removing Processed Custom Objects finished with count {0}',
    searchQuery.count,
  );
  searchQuery.close();

  return PIPELET_NEXT;
}

/**
 * Submits an order, original function located in OrderModel, but we need to manage triggering of email
 * @param order {dw.order.Order} The order object to be submitted.
 * @transactional
 * @return {Object} object If order cannot be placed, object.error is set to true. Ortherwise, object.order_created is true, and object.Order is set to the order.
 */
function submitOrder(order) {
  const adyenService = require('*/cartridge/scripts/adyenService');
  adyenService.submit(order);

  return {
    Order: order,
    order_created: true,
  };
}

module.exports = {
  execute: execute,
  processNotifications: processNotifications,
  clearNotifications: clearNotifications,
};
