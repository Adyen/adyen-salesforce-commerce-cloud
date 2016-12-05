'use strict';

/* API Includes */
var Pipeline = require('dw/system/Pipeline');
var logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');


/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');
/**
 * Creates a Adyen payment instrument for the given basket
 */
function Handle(args) {
	logger.debug('Calling ADYEN_CREDIT.js payment processor Handle action, execute pipeline call');
    var pdict = Pipeline.execute('ADYEN_CREDIT-Handle',{Basket : args.Basket});
	switch(pdict.EndNodeName) {
	case 'success':
		return {success : true};
	case 'error':
		return {error : true};
	}
	logger.debug('After execute pipeline call in ADYEN_CREDIT.js controller Handle action');
}

/**
 * Call the  Adyen API to Authorize CC using details entered by shopper.
 */
function Authorize(args) {
	logger.debug('Calling ADYEN_CREDIT.js payment processor Authorize action, execute pipeline call');
	var pdict = Pipeline.execute('ADYEN_CREDIT-Authorize',{
		Order : args.Order
		});
	switch (pdict.EndNodeName) {
	case 'authorized':
		return {authorized : true};
	case 'error':
		return {error : true};
	}
	logger.debug('After execute pipeline call in ADYEN_CREDIT.js controller Authorize action');
}

exports.Handle = Handle;
exports.Authorize = Authorize;
