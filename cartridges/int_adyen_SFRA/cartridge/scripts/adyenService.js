"use strict";

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var HashMap = require('dw/util/HashMap');
var Mail = require('dw/net/Mail');
var Template = require('dw/util/Template');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
function sendEmail(order) {
  var confirmationEmail = new Mail();
  var context = new HashMap();
  var savedOrderModel = order.custom.Adyen_CustomerEmail;
  var orderObject = {
    order: JSON.parse(savedOrderModel)
  };
  confirmationEmail.addTo(order.customerEmail);
  confirmationEmail.setSubject(Resource.msg('subject.order.confirmation.email', 'order', null));
  confirmationEmail.setFrom(Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com');
  Object.keys(orderObject).forEach(function (key) {
    context.put(key, orderObject[key]);
  });
  var template = new Template('checkout/confirmation/confirmationEmail');
  var content = template.render(context).text;
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
      var fraudDetectionStatus = {
        status: 'success'
      };
      var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
      if (placeOrderResult.error) {
        return placeOrderResult;
      }
    }
    sendEmail(order);
    Transaction.commit();
    return {
      order_created: true
    };
  } catch (e) {
    Transaction.rollback();
    return {
      error: true
    };
  }
}
module.exports = {
  submit: submit
};