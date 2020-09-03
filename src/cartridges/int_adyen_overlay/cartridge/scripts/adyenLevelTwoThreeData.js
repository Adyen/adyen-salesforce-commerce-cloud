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

function getLineItemObjectWithTaxTotal(allLineItems) {
  return function (acc, item) {
    const lineItem = allLineItems[item];
    const description = LineItemHelper.getDescription(lineItem);
    const id = LineItemHelper.getId(lineItem);
    const quantity = LineItemHelper.getQuantity(lineItem);
    const itemAmount = LineItemHelper.getItemAmount(lineItem) / quantity;
    const vatAmount = LineItemHelper.getVatAmount(lineItem) / quantity;
    const taxTotal = acc.taxTotal + parseFloat(vatAmount.toFixed());
    const commodityCode = AdyenHelper.getAdyenLevel23CommodityCode();

    const fields = {
      description: description.substring(0, 26).replace(/[^\x00-\x7F]/g, ''),
      unitPrice: itemAmount.toFixed(),
      totalAmount: JSON.stringify(parseFloat(itemAmount.toFixed()) + parseFloat(vatAmount.toFixed())),
      quantity,
      productCode: id.substring(0, 12),
      unitOfMeasure: 'EAC',
      ...(commodityCode && { commodityCode }),
    };
    const lineItemDetail = Object.keys(fields).reduce((acc, key) => ({
      ...acc,
      [`enhancedSchemeData.itemDetailLine${item + 1}.${key}`]: fields[key],
    }), {});

    const lineItemObject = {
      ...acc.lineItemObject,
      ...lineItemDetail,
    };

    return { taxTotal, lineItemObject };
  };
}

function getLineItems({ Order: order }) {
  if (!order) {
    return null;
  }

  // Add all product and shipping line items to request
  const allLineItems = order.getAllLineItems();
  const shopperReference = getShopperReference(order);

  const initialLineItemObject = { 'enhancedSchemeData.customerReference': shopperReference.substring(0, 25) };
  const initialLineItemsAcc = { taxTotal: 0.0, lineItemObject: initialLineItemObject };
  const { taxTotal, lineItemObject } = Object.keys(allLineItems).reduce(getLineItemObjectWithTaxTotal(allLineItems), initialLineItemsAcc);

  return {
    ...lineItemObject,
    'enhancedSchemeData.totalTaxAmount': JSON.stringify(taxTotal),
  };
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
