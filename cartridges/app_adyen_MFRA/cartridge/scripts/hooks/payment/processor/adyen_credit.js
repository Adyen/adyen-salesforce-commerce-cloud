/**
 * 
 */


'use strict';
var server = require('server');
//var Cart = require("app_storefront_base/cartridge/controllers/Cart");
function Handle(currentBasket, paymentInformation) {
	
	var cart = require("app_storefront_base/cartridge/model/cart");
	var cartModel = cart.CartModel(currentBasket);
    return {success: true};
 
}

exports.Handle = Handle;