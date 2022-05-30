const server = require('server');
const Logger = require('dw/system/Logger');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('Start', csrfProtection.generateToken, (_req, res, next) => {
  res.render('adyenSettings/settings');
  return next();
});

server.post('Save', csrfProtection.generateToken, (req, res, next) => {
  const formData = req.form;
  Logger.getLogger('Adyen').error(JSON.stringify(formData));
  return next();
});

module.exports = server.exports();
