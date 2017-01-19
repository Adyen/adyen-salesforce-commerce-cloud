'use strict';

/* API Includes */
var Pipeline = require('dw/system/Pipeline');
var logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var URLUtils = require('dw/web/URLUtils');



/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function Handle(args) {
    var pdict = Pipeline.execute('ADYEN_CREDIT-Handle',{Basket : args.Basket});
	switch(pdict.EndNodeName) {
	case 'success':
		return {success : true};
	case 'error':
		return {error : true};
	}
}

/**
 * Call the  Adyen API to Authorize CC using details entered by shopper.
 */
function Authorize(args) {
	var pdict = Pipeline.execute('ADYEN_CREDIT-AuthorizePrivat',{
		Order : args.Order,
		PaymentInstrument : args.PaymentInstrument
		});
	switch (pdict.EndNodeName) {
	case 'authorized3d' :
		session.custom.order = args.Order;
		session.custom.paymentInstrument = args.PaymentInstrument;
		return {
			authorized : true,
			authorized3d : true,
			view : app.getView({
				ContinueURL: URLUtils.https('Adyen-CloseIFrame', 'utm_nooverride', '1'),
				Basket : pdict.Order,
		    	issuerUrl : pdict.issuerUrl,
		    	paRequest: pdict.paRequest,
		    	md : pdict.md
		 })};
	case 'authorized':
		return {authorized : true};
	case 'error':
		return {error : true};
	}
}
exports.Handle = Handle;
exports.Authorize = Authorize;
