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
 * Risk data fields
 */

var LineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');
var __RiskDataHelper = {
  createBasketContentFields: function createBasketContentFields(order) {
    var productLines = order.getProductLineItems().toArray();
    var itemNr = 1;
    var basketData = {};
    // eslint-disable-next-line complexity
    productLines.forEach(function (item) {
      var quantity = LineItemHelper.getQuantity(item);
      basketData["riskdata.basket.item".concat(itemNr, ".itemID")] = LineItemHelper.getId(item);
      basketData["riskdata.basket.item".concat(itemNr, ".productTitle")] = LineItemHelper.getDescription(item);
      basketData["riskdata.basket.item".concat(itemNr, ".amountPerItem")] = LineItemHelper.getItemAmount(item).divide(quantity).value.toFixed();
      basketData["riskdata.basket.item".concat(itemNr, ".currency")] = item.adjustedNetPrice.currencyCode;
      basketData["riskdata.basket.item".concat(itemNr, ".upc")] = item.product ? item.product.UPC : '';
      basketData["riskdata.basket.item".concat(itemNr, ".sku")] = item.product ? item.product.manufacturerSKU : '';
      basketData["riskdata.basket.item".concat(itemNr, ".brand")] = item.product ? item.product.brand : '';
      basketData["riskdata.basket.item".concat(itemNr, ".manufacturer")] = item.product ? item.product.manufacturerName : '';
      basketData["riskdata.basket.item".concat(itemNr, ".category")] = item.product && item.product.primaryCategory ? item.product.primaryCategory.displayName : '';
      basketData["riskdata.basket.item".concat(itemNr, ".quantity")] = quantity;
      itemNr++;
    });
    return basketData;
  }
};
module.exports = __RiskDataHelper;