const Site = require('dw/system/Site');
const Resource = require('dw/web/Resource');
const HashMap = require('dw/util/HashMap');
const Mail = require('dw/net/Mail');
const Template = require('dw/util/Template');
const Transaction = require('dw/system/Transaction');

function submit(order) {
  const confirmationEmail = new Mail();
  const context = new HashMap();

  const savedOrderModel = order.custom.Adyen_CustomerEmail;
  const orderObject = { order: JSON.parse(savedOrderModel) };

  confirmationEmail.addTo(order.customerEmail);
  confirmationEmail.setSubject(
    Resource.msg('subject.order.confirmation.email', 'order', null),
  );
  confirmationEmail.setFrom(
    Site.current.getCustomPreferenceValue('customerServiceEmail')
      || 'no-reply@salesforce.com',
  );

  Object.keys(orderObject).forEach(function (key) {
    context.put(key, orderObject[key]);
  });

  const template = new Template('checkout/confirmation/confirmationEmail');
  const content = template.render(context).text;
  confirmationEmail.setContent(content, 'text/html', 'UTF-8');
  confirmationEmail.send();

  Transaction.wrap(function () {
    order.custom.Adyen_CustomerEmail = null;
  });
}

module.exports = {
  submit: submit,
};
