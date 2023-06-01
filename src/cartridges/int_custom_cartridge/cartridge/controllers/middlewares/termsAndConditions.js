const Resource = require('dw/web/Resource');

function termsAndConditions(req, res, next) {
  if (req.form && !req.form.termsAndConditions) {
    res.json({
      error: true,
      errorStage: {
        stage: 'placeOrder',
      },
      errorMessage: Resource.msg('termsAndConditions', 'custom', null),
    });
    this.emit('route:Complete', req, res);
  } else {
    return next();
  }
}
module.exports = termsAndConditions;
