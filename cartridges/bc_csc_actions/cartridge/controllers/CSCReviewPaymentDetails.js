var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');
var orderMgr = require('dw/order/OrderMgr');


/**
 * Provides a list of order payment instruments for detailed review
 */
exports.Start = function(){
    
    this.order_no = request.httpParameterMap.order_no.stringValue;
    this.order = orderMgr.getOrder(this.order_no);
    
	try {
	    ISML.renderTemplate('order/payment/order_payment_details.isml', {"order_no" : order_no, "order" : order});
	} catch (e) {
	    Logger.error('Error while rendering template ' + templateName);
	    throw e;
	}
}

exports.Start.public = true;