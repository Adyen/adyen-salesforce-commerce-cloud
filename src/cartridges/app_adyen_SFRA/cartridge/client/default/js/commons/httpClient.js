const $ = require('jquery');

function httpClient(config) {
  const defaults = {
    method: 'GET',
    contentType: 'application/x-www-form-urlencoded',
    timeout: 10000,
  };

  const settings = $.extend({}, defaults, config);

  if (!config?.data?.csrf_token) {
    settings.data = {
      ...settings.data,
      csrf_token: $('#adyen-token').val(),
    };
  }

  return $.ajax(settings);
}

module.exports = {
  httpClient,
};
