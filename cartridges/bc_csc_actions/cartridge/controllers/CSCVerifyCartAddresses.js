var BasketMgr = require('dw/order/BasketMgr');
var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');

/**
 * Controller to display an address verification result for all addresses of the basket. For this demo all verification will be done in the template
 */
exports.Start = function(){
	
	let basketId = request.httpParameterMap.basket_id.stringValue;  
    this.basket = BasketMgr.getBasket(basketId);
	
	try {
	    ISML.renderTemplate('basket/addressCheck/address_check.isml', {"basketId" : basketId, "basket" : basket});
	} catch (e) {
	   Logger.error('Error while rendering template ' + templateName);
	    throw e;
	}
}

exports.Start.public = true;