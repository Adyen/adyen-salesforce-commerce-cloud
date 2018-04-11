'use strict';
//var csrfProtection = require('app_storefront_base/cartridge/scripts/middleware/csrf');
//var checkoutService = require("app_storefront_base/cartridge/controllers/CheckoutServices");// require functionality from last controller in the chain with t
var server = require('server');
server.extend(module.superModule);

server.append('SubmitPayment', function(req, res, next) {
	 var billingData = res.getViewData();
	 billingData.paymentInformation.CSE = "test";
	 res.setViewData(billingData);
	next();
});

module.exports = server.exports();