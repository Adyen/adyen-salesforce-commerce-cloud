'use strict';

var checkoutShippingServices = module.superModule; // require functionality from last controller in the chain with t
var server = require('server');
server.extend(checkoutShippingServices);

server.append('SubmitShipping', function(req, res, next) {
	var BasketMgr = require('dw/order/BasketMgr');
	var currentBasket = BasketMgr.getCurrentBasket();
	var	getPaymentMethods = require('int_adyen/cartridge/scripts/getPaymentMethodsSHA256');
	var methods = getPaymentMethods.getMethods(currentBasket, "US");
   res.setViewData({ value: methods });
   next();
				});

module.exports = server.exports();