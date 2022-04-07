"use strict";

var URLUtils = require('dw/web/URLUtils');

var Logger = require('dw/system/Logger');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
/**
 * Initiates a 3DS1 payment
 */


function adyen3d(req, res, next) {
  var IssuerURL = req.querystring.IssuerURL;
  var PaRequest = req.querystring.PaRequest;
  var MD = req.querystring.MD;
  var merchantReference = req.querystring.merchantReference;
  var TermURL = URLUtils.https('Adyen-AuthorizeWithForm', 'merchantReference', merchantReference);
  var signature = req.querystring.signature;
  var currentSignature = AdyenHelper.getAdyenHash(IssuerURL.substr(IssuerURL.length - 25), MD.substr(1, 25));

  if (signature === currentSignature) {
    res.render('adyenform', {
      issuerUrl: IssuerURL,
      paRequest: PaRequest,
      md: MD,
      ContinueURL: TermURL
    });
    return next();
  }

  Logger.getLogger('Adyen').error('Signature incorrect for 3DS payment');
  res.redirect(URLUtils.url('Home-Show', 'Payment', 'Failed3DS'));
  return next();
}

module.exports = adyen3d;