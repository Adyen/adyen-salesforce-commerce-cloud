 /*
 * Script to run Adyen notification related jobs
 */

/* API Includes */
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

function execute(pdict) {
	processNotifications(pdict);
	clearNotifications(pdict);
	return PIPELET_NEXT;
}

/**
 * ProcessNotifications - search for custom objects that need to be processed and handle them to place or fail order
 */
function processNotifications(pdict) {
	var logger = require('*/cartridge/scripts/models/LoggerModel').getLogger('Adyen', 'adyen');
	var	objectsHandler = require('*/cartridge/scripts/handleCustomObject');
	var searchQuery = CustomObjectMgr.queryCustomObjects("adyenNotification", "custom.updateStatus = 'PROCESS'", null);
	logger.info("Process notifications start with count {0}", searchQuery.count);

	var customObj, handlerResult, order, notify;
	while (searchQuery.hasNext()) {
		customObj = searchQuery.next();
		Transaction.wrap(function () {
			handlerResult = objectsHandler.handle(customObj);
		});
		
		/*
			Sometimes order cannot be found in DWRE DB even if it exists there, 
			in that case we shouldn't reply to Adyen that all was ok in order to get a new notification
		*/
		
		order = handlerResult.Order;
		if (!handlerResult.status || handlerResult.status === PIPELET_ERROR) {
			// Only CREATED orders can be failed
			if (order == null || order.status != dw.order.Order.ORDER_STATUS_CREATED || handlerResult.RefusedHpp) {
				continue;
			}
			// Refused payments which are made with using Adyen payment method are handled when user is redirected back from Adyen HPP.
			// Here we shouldn't fail an order and send a notification
			Transaction.wrap(function () {
				OrderMgr.failOrder(order);
			});
			continue;
		}
		
		if (handlerResult.SkipOrder || handlerResult.Pending) {
			continue;
		}
		
		// Submitting an order -> update status and send all required email
		if(handlerResult.SubmitOrder){
            var placeOrderResult = submitOrder(order);
            if (!placeOrderResult.order_created || placeOrderResult.error) {
                logger.error('Failed to place an order: {0}, during notification process.', order.orderNo);
            }
		}
	}
	logger.info("Process notifications finished with count {0}", searchQuery.count);
	searchQuery.close();
	
	return PIPELET_NEXT;
}

/**
 * cleanNotifications
 */
function clearNotifications(pdict) {
	var logger = require('*/cartridge/scripts/models/LoggerModel').getLogger('Adyen', 'adyen');
	var	deleteCustomObjects = require('*/cartridge/scripts/deleteCustomObjects');
	var searchQuery = CustomObjectMgr.queryCustomObjects("adyenNotification", "custom.processedStatus = 'SUCCESS'", null);
	logger.info("Removing Processed Custom Objects start with count {0}", searchQuery.count);

	var customObj;
	while (searchQuery.hasNext()) {
		customObj = searchQuery.next();
		Transaction.wrap(function () {
			deleteCustomObjects.remove(customObj);
		});
		
	}
	logger.info("Removing Processed Custom Objects finished with count {0}", searchQuery.count);
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
    var adyenService = require('*/cartridge/scripts/adyenService');
	return adyenService.submit(order);
}

module.exports = {
	'execute': execute,
	'processNotifications': processNotifications,
	'clearNotifications': clearNotifications
}