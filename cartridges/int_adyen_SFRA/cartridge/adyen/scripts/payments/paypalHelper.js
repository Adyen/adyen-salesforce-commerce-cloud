"use strict";

/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen Salesforce Commerce Cloud
 * Copyright (c) 2021 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 *
 * Add all product and shipping line items to request
 */

var LineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');
var PAYPAL_ITEM_CATEGORY = ['PHYSICAL_GOODS', 'DIGITAL_GOODS', 'DONATION'];
function getLineItems(lineItemCntr) {
  if (!lineItemCntr) return null;
  var allLineItems = LineItemHelper.getAllLineItems(lineItemCntr.getAllLineItems());
  return allLineItems.map(function (lineItem) {
    var lineItemObject = {};
    var description = LineItemHelper.getDescription(lineItem);
    var id = LineItemHelper.getId(lineItem);
    var quantity = LineItemHelper.getQuantity(lineItem);
    var itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
    var vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
    // eslint-disable-next-line
    if (lineItem.hasOwnProperty('category')) {
      if (PAYPAL_ITEM_CATEGORY.indexOf(lineItem.category) > -1) {
        lineItemObject.itemCategory = lineItem.category;
      }
    }
    lineItemObject.quantity = quantity;
    lineItemObject.description = description;
    lineItemObject.sku = id;
    lineItemObject.amountExcludingTax = itemAmount.getValue().toFixed();
    lineItemObject.taxAmount = vatAmount.getValue().toFixed();
    return lineItemObject;
  });
}
module.exports.getLineItems = getLineItems;