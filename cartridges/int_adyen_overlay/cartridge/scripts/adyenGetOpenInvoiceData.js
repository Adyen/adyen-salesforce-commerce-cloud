"use strict";

/**
 * Generate the parameters needed for the redirect to the Adyen Hosted Payment Page.
 * A signature is calculated based on the configured HMAC code
 *
 * @input Order : dw.order.Order
 * @input OrderNo : String The order no
 * @input CurrentSession : dw.system.Session
 * @input CurrentUser : dw.customer.Customer
 * @input PaymentInstrument : dw.order.PaymentInstrument
 * @input brandCode : String
 * @input issuerId : String
 * @input dob : String
 * @input gender : String
 * @input telephoneNumber : String
 * @input houseNumber : String
 * @input houseExtension : String
 * @input socialSecurityNumber : String
 *
 * @output merchantSig : String;
 * @output Amount100 : String;
 * @output shopperEmail : String;
 * @output shopperReference : String;
 * @output paramsMap : dw.util.SortedMap;
 * @output sessionValidity : String;
 *
 */
require('dw/crypto');

require('dw/system');

require('dw/order');

require('dw/util');

require('dw/value');

require('dw/net');

require('dw/web'); // script include


var LineItemHelper = require('*/cartridge/scripts/util/lineItemHelper');

function getLineItems(args) {
  var order;

  if (args.Order) {
    order = args.Order;
  } else {
    return null;
  } // Add all product and shipping line items to request


  var lineItems = [];
  var allLineItems = order.getAllLineItems();

  for (var item in allLineItems) {
    var lineItem = allLineItems[item];

    if (lineItem instanceof dw.order.ProductLineItem && !lineItem.bonusProductLineItem || lineItem instanceof dw.order.ShippingLineItem || lineItem instanceof dw.order.PriceAdjustment && lineItem.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER) {
      var lineItemObject = {};
      var description = LineItemHelper.getDescription(lineItem);
      var id = LineItemHelper.getId(lineItem);
      var quantity = LineItemHelper.getQuantity(lineItem);
      var itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
      var vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
      var vatPercentage = LineItemHelper.getVatPercentage(lineItem);
      lineItemObject.amountExcludingTax = itemAmount.getValue().toFixed();
      lineItemObject.taxAmount = vatAmount.getValue().toFixed();
      lineItemObject.description = description;
      lineItemObject.id = id;
      lineItemObject.quantity = quantity;
      lineItemObject.taxCategory = 'None';
      lineItemObject.taxPercentage = (new Number(vatPercentage) * 10000).toFixed();
      lineItems.push(lineItemObject);
    }
  }

  return lineItems;
}

module.exports = {
  getLineItems: getLineItems
};