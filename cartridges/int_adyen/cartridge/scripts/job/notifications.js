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
var logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');

function execute(pdict) {
	processNotifications(pdict);
	clearNotifications(pdict);
	return PIPELET_NEXT;
}

/**
 * ProcessNotifications - search for custom objects that need to be processed and handle them to place or fail order
 */
function processNotifications(pdict) {
	var	objectsHandler = require('int_adyen/cartridge/scripts/handleCustomObject');
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
		notify = !handlerResult.SkipNotification;
		
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
			
			// sent order reject email
			if (notify){
			    Email.sendMail({
			        template: 'mail/orderrejected', // 'mail/orderconfirmation'
			        recipient: order.getCustomerEmail(),
			        subject: 'Your order with Demandware online store',
			        context: {
			            Order: order
			        }
			    });
			}
			continue;
		}
		
		if (handlerResult.SkipOrder || handlerResult.Pending) {
			continue;
		}
		
		// Submitting an order -> update status and send all required email
		var placeOrderResult = submitOrder(order, notify);
		if (!placeOrderResult.order_created || placeOrderResult.error) {
			logger.error('Failed to place an order: {0}, during notification process.', order.orderNo);
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
	var	deleteCustomObjects = require('int_adyen/cartridge/scripts/deleteCustomObjects');
	var searchQuery = CustomObjectMgr.queryCustomObjects("adyenNotification", "custom.processedStatus = 'SUCCESS'", null);
	logger.info("Removing Processed Custom Objects start with count {0}", searchQuery.count);

	var customObj, orderID;
	while (searchQuery.hasNext()) {
		customObj = searchQuery.next();
		orderID = customObj.custom.orderId.split("-", 1)[0];
		Transaction.wrap(function () {
			deleteCustomObjects.handle(orderID);
		});
		
	}
	logger.info("Removing Processed Custom Objects finished with count {0}", searchQuery.count);
	searchQuery.close();
	
	return PIPELET_NEXT;
}

/**
 * Place an order using OrderMgr. If order is placed successfully,
 * its status will be set as confirmed, and export status set to ready.
 * @param {dw.order.Order} order
 */
function placeOrder(order) {
    var placeOrderStatus = OrderMgr.placeOrder(order);
    if (placeOrderStatus === Status.ERROR) {
        OrderMgr.failOrder(order);
        throw new Error('Failed to place order.');
    }
    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    order.setExportStatus(Order.EXPORT_STATUS_READY);
}

/**
 * Submits an order, original function located in OrderModel, but we need to manage triggering of email
 * @param order {dw.order.Order} The order object to be submitted.
 * @transactional
 * @return {Object} object If order cannot be placed, object.error is set to true. Ortherwise, object.order_created is true, and object.Order is set to the order.
 */
function submitOrder(order, notificate) {
	var Email = require('app_storefront_controllers/cartridge/scripts/models/EmailModel');
    var GiftCertificate = require('app_storefront_controllers/cartridge/scripts/models/GiftCertificateModel');
    
    try {
        Transaction.begin();
        placeOrder(order);

        // Creates gift certificates for all gift certificate line items in the order
        // and sends an email to the gift certificate receiver

        order.getGiftCertificateLineItems().toArray().map(function (lineItem) {
            return GiftCertificate.createGiftCertificateFromLineItem(lineItem, order.getOrderNo());
        }).forEach(GiftCertificate.sendGiftCertificateEmail);
        
        Transaction.commit();
    } catch (e) {
        Transaction.rollback();
        return {
            error: true,
            PlaceOrderError: new Status(Status.ERROR, 'confirm.error.technical')
        };
    }
    
    if (notificate) {
	    Email.sendMail({
	        template: 'mail/orderconfirmation',
	        recipient: order.getCustomerEmail(),
	        subject: Resource.msg('order.orderconfirmation-email.001', 'order', null),
	        context: {
	            Order: order
	        }
	    });
    }

    return {
        Order: order,
        order_created: true
    };
}

module.exports = {
	'execute': execute,
	'processNotifications': processNotifications,
	'clearNotifications': clearNotifications
}