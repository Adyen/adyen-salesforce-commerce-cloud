const { AdyenError } = require('*/cartridge/adyen/logs/adyenError');

module.exports = (error, res, data) => {
  if (error instanceof AdyenError) {
    res.json({ ...data, error: true, errorType: 'AdyenError' });
  } else {
    res.json({ ...data, error: true });
  }
};
