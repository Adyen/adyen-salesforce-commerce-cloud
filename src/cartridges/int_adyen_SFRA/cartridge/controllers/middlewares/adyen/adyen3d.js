const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function adyen3d(req, res, next) {
  const { IssuerURL } = req.querystring;
  const { PaRequest } = req.querystring;
  const { MD } = req.querystring;
  const TermURL = URLUtils.https('Adyen-AuthorizeWithForm');
  const { signature } = req.querystring;
  const currentSignature = AdyenHelper.getAdyenHash(
    IssuerURL.substr(IssuerURL.length - 25),
    MD.substr(1, 25),
  );

  if (signature === currentSignature) {
    res.render('adyenform', {
      issuerUrl: IssuerURL,
      paRequest: PaRequest,
      md: MD,
      ContinueURL: TermURL,
    });
    return next();
  }
  Logger.getLogger('Adyen').error('Signature incorrect for 3DS payment');
  res.redirect(URLUtils.url('Home-Show', 'Payment', 'Failed3DS'));
  return next();
}

module.exports = adyen3d;
