var BasketMgr = require('dw/order/BasketMgr');
var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');

/**
 * Provides a reservation form to reserve items manually
 */
exports.Start = function(){
	
	let basketId = request.httpParameterMap.basket_id.stringValue;
    this.basket = BasketMgr.getBasket(basketId);
    
	try {
	    ISML.renderTemplate('basket/inventory/reserve_inventory.isml', {"basketId" : basketId, "basket" : basket});
	} catch (e) {
	    Logger.error('Error while rendering template ' + templateName);
	    throw e;
	}
}

/**
 * Reserves the basket items for the given time in minutes
 */
exports.Reserve = function(){
    
	this.basketId = request.httpParameterMap.basket_id.stringValue;  
    this.minutes = request.httpParameterMap.minutes.intValue;   
    
    this.basket = BasketMgr.getBasket(basketId);
    this.status=basket.reserveInventory(this.minutes);
    
    let isml = require('dw/template/ISML');
	try {
	    ISML.renderTemplate('basket/inventory/reserve_inventory_confirmation.isml', {"basketId" : basketId, "basket" : basket});
	} catch (e) {
	    Logger.error('Error while rendering template ' + templateName);
	    throw e;
	}

};
exports.Start.public = true;
exports.Reserve.public = true;
