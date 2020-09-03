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
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

const LineItemHelper = require('*/cartridge/scripts/util/lineItemHelper');

function getLineItems({ Order: order }) {
  if (!order) return null;
  // Add all product and shipping line items to request
  const lineItemObject = {};
  const allLineItems = order.getAllLineItems();
  const shopperReference = getShopperReference(order);

  lineItemObject['enhancedSchemeData.customerReference'] = shopperReference.substring(0, 25);

  const taxTotal = allLineItems.toArray().reduce((acc, lineItem, index) => {
    const description = LineItemHelper.getDescription(lineItem);
    const id = LineItemHelper.getId(lineItem);
    const quantity = LineItemHelper.getQuantity(lineItem);
    const itemAmount = LineItemHelper.getItemAmount(lineItem) / quantity;
    const vatAmount = LineItemHelper.getVatAmount(lineItem) / quantity;

    lineItemObject[`enhancedSchemeData.itemDetailLine${index + 1}.description`] = description.substring(0, 26).replace(/[^\x00-\x7F]/g, '');
    lineItemObject[`enhancedSchemeData.itemDetailLine${index + 1}.unitPrice`] = itemAmount.toFixed();
    lineItemObject[`enhancedSchemeData.itemDetailLine${index + 1}.totalAmount`] = parseFloat(itemAmount.toFixed()) + parseFloat(vatAmount.toFixed());
    lineItemObject[`enhancedSchemeData.itemDetailLine${index + 1}.quantity`] = quantity;
    lineItemObject[`enhancedSchemeData.itemDetailLine${index + 1}.productCode`] = id.substring(0, 12);
    lineItemObject[`enhancedSchemeData.itemDetailLine${index + 1}.unitOfMeasure`] = 'EAC';
    if (AdyenHelper.getAdyenLevel23CommodityCode()) {
      lineItemObject[`enhancedSchemeData.itemDetailLine${index + 1}.commodityCode`] = AdyenHelper.getAdyenLevel23CommodityCode();
    }
    return acc + parseFloat(vatAmount.toFixed());
  }, 0.0);
  lineItemObject['enhancedSchemeData.totalTaxAmount'] = taxTotal;
  return lineItemObject;
}

function getShopperReference(order) {
  const customer = order.getCustomer();
  const isRegistered = customer && customer.registered;
  const profile = isRegistered && customer.getProfile();
  const profileCustomerNo = profile && profile.getCustomerNo();
  const orderNo = profileCustomerNo || order.getCustomerNo();
  return orderNo || customer.getID() || 'no-unique-ref';
}

module.exports.getLineItems = getLineItems;
