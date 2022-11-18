"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
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

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var LineItemHelper = require('*/cartridge/scripts/util/lineItemHelper');
function getLineItems(_ref) {
  var order = _ref.Order,
    basket = _ref.Basket;
  if (!(order || basket)) return null;
  var orderOrBasket = order || basket;
  var allLineItems = orderOrBasket.getProductLineItems();
  var shopperReference = getShopperReference(orderOrBasket);
  return allLineItems.toArray().reduce(function (acc, lineItem, index) {
    var _objectSpread2;
    var description = LineItemHelper.getDescription(lineItem);
    var id = LineItemHelper.getId(lineItem);
    var quantity = LineItemHelper.getQuantity(lineItem);
    var itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
    var vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
    var commodityCode = AdyenConfigs.getAdyenLevel23CommodityCode();
    var currentLineItem = _objectSpread(_objectSpread(_objectSpread((_objectSpread2 = {}, _defineProperty(_objectSpread2, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".unitPrice"), itemAmount.value.toFixed()), _defineProperty(_objectSpread2, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".totalAmount"), parseFloat(itemAmount.value.toFixed()) + parseFloat(vatAmount.value.toFixed())), _defineProperty(_objectSpread2, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".quantity"), quantity), _defineProperty(_objectSpread2, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".unitOfMeasure"), 'EAC'), _objectSpread2), commodityCode && _defineProperty({}, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".commodityCode"), commodityCode)), description && _defineProperty({}, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".description"), description.substring(0, 26).replace(/[^\x00-\x7F]/g, ''))), id && _defineProperty({}, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".productCode"), id.substring(0, 12)));
    return _objectSpread(_objectSpread(_objectSpread({}, acc), currentLineItem), {}, {
      'enhancedSchemeData.totalTaxAmount': acc['enhancedSchemeData.totalTaxAmount'] + parseFloat(vatAmount.value.toFixed())
    });
  }, {
    'enhancedSchemeData.totalTaxAmount': 0.0,
    'enhancedSchemeData.customerReference': shopperReference.substring(0, 25)
  });
}
function getShopperReference(orderOrBasket) {
  var customer = orderOrBasket.getCustomer();
  var isRegistered = customer && customer.registered;
  var profile = isRegistered && customer.getProfile();
  var profileCustomerNo = profile && profile.getCustomerNo();
  var orderNo = profileCustomerNo || orderOrBasket.getCustomerNo();
  return orderNo || customer.getID() || 'no-unique-ref';
}
module.exports.getLineItems = getLineItems;