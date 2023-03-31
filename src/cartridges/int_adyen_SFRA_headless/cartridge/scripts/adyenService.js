const Site = require('dw/system/Site');
const Resource = require('dw/web/Resource');
const HashMap = require('dw/util/HashMap');
const Mail = require('dw/net/Mail');
const Template = require('dw/util/Template');
const Transaction = require('dw/system/Transaction');
const Order = require('dw/order/Order');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

function sendEmail(order) {
  const confirmationEmail = new Mail();
  const context = new HashMap();

  const savedOrderModel = order.custom.Adyen_CustomerEmail;
  const orderObject = { order: JSON.parse(savedOrderModel) };

  confirmationEmail.addTo(order.customerEmail);
  confirmationEmail.setSubject(
    Resource.msg('subject.order.confirmation.email', 'order', null),
  );
  confirmationEmail.setFrom(
    Site.current.getCustomPreferenceValue('customerServiceEmail') ||
      'no-reply@salesforce.com',
  );

  Object.keys(orderObject).forEach((key) => {
    context.put(key, orderObject[key]);
  });

  const template = new Template('checkout/confirmation/confirmationEmail');
  const content = template.render(context).text;
  confirmationEmail.setContent(content, 'text/html', 'UTF-8');
  confirmationEmail.send();

  order.custom.Adyen_CustomerEmail = null;
}

function submit(order) {
  try {
    Transaction.begin();
    // Places the order if not placed yet
    if (order.status === Order.ORDER_STATUS_CREATED) {
      // custom fraudDetection
      const fraudDetectionStatus = { status: 'success' };
      const placeOrderResult = COHelpers.placeOrder(
        order,
        fraudDetectionStatus,
      );
      if (placeOrderResult.error) {
        return placeOrderResult;
      }
    }

    sendEmail(order);
    Transaction.commit();

    return {
      order_created: true,
    };
  } catch (e) {
    Transaction.rollback();
    return {
      error: true,
    };
  }
}

module.exports = {
  submit,
};
