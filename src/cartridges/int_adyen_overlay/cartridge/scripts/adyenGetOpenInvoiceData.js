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
require('dw/web');

// script include
const LineItemHelper = require('*/cartridge/scripts/util/lineItemHelper');

function getLineItems(args) {
  let order;
  if (args.Order) {
    order = args.Order;
  } else {
    return null;
  }

  // Add all product and shipping line items to request
  const lineItems = [];
  const allLineItems = order.getAllLineItems();
  for (const item in allLineItems) {
    const lineItem = allLineItems[item];
    if (
      (lineItem instanceof dw.order.ProductLineItem
        && !lineItem.bonusProductLineItem)
      || lineItem instanceof dw.order.ShippingLineItem
      || (lineItem instanceof dw.order.PriceAdjustment
        && lineItem.promotion.promotionClass
          === dw.campaign.Promotion.PROMOTION_CLASS_ORDER)
    ) {
      const lineItemObject = {};
      const description = LineItemHelper.getDescription(lineItem);
      const id = LineItemHelper.getId(lineItem);
      const quantity = LineItemHelper.getQuantity(lineItem);
      const itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
      const vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
      const vatPercentage = LineItemHelper.getVatPercentage(lineItem);

      lineItemObject.amountExcludingTax = itemAmount.getValue().toFixed();
      lineItemObject.taxAmount = vatAmount.getValue().toFixed();
      lineItemObject.description = description;
      lineItemObject.id = id;
      lineItemObject.quantity = quantity;
      lineItemObject.taxCategory = 'None';
      lineItemObject.taxPercentage = (
        new Number(vatPercentage) * 10000 // eslint-disable-line no-new-wrappers
      ).toFixed();

      lineItems.push(lineItemObject);
    }
  }

  return lineItems;
}

module.exports = {
  getLineItems: getLineItems,
};
