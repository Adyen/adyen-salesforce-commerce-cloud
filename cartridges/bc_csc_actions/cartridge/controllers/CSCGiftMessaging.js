var BasketMgr = require('dw/order/BasketMgr');
var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');
var txn = require('dw/system/Transaction');

/**
 * Displays current gift message information per shipment
 */
exports.Start = function(){
	
    this.basketId = request.httpParameterMap.basket_id.stringValue; 
    this.basket = BasketMgr.getBasket(basketId);
    
	try {
	    ISML.renderTemplate('basket/gift/gift_message_start.isml', {"basketId" : basketId, "basket" : basket});
	} catch (e) {
	    Logger.error('Error while rendering template ' + templateName);
	    throw e;
	}
}

/**
 * Updates submitted gift messaging information.
 */
exports.Execute = function(){
	
    this.basketId = request.httpParameterMap.basket_id.stringValue; 
    this.basket = BasketMgr.getBasket(basketId);
    
    txn.begin();

    for each( c in this.basket.getShipments().iterator() ) {
    	
    	var isGift = request.httpParameterMap.get(c.getID() + '_isgift');
    	var message = request.httpParameterMap.get(c.getID() + '_message');

    	if(isGift == 'on'){
    		c.setGift(true);
    		c.setGiftMessage(message);
    	}
    	else{
    		c.setGift(false);
    		c.setGiftMessage(null);
    	}
	}
    
    txn.commit();
	
	try {
	    ISML.renderTemplate('basket/gift/gift_message_confirmation.isml', {"basketId" : basketId, "basket" : basket});
	} catch (e) {
	    Logger.error('Error while rendering template ' + templateName);
	    throw e;
	}

}

exports.Start.public = true;
exports.Execute.public = true;
