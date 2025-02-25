"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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

var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var LineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');

// eslint-disable-next-line complexity
function getShopperReference(orderOrBasket) {
  var customer = orderOrBasket.getCustomer();
  var isRegistered = customer && customer.registered;
  var profile = isRegistered && customer.getProfile();
  var profileCustomerNo = profile && profile.getCustomerNo();
  var orderNo = profileCustomerNo || orderOrBasket.getCustomerNo();
  return orderNo || customer.getID() || 'no-unique-ref';
}
function getLineItems(_ref) {
  var order = _ref.Order,
    basket = _ref.Basket;
  if (!(order || basket)) return null;
  var orderOrBasket = order || basket;
  var allLineItems = orderOrBasket.getProductLineItems();
  var shopperReference = getShopperReference(orderOrBasket);
  return allLineItems.toArray().reduce(function (acc, lineItem, index) {
    var description = LineItemHelper.getDescription(lineItem);
    var id = LineItemHelper.getId(lineItem);
    var quantity = LineItemHelper.getQuantity(lineItem);
    var itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
    var vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
    var commodityCode = AdyenConfigs.getAdyenLevel23CommodityCode();
    var currentLineItem = _objectSpread(_objectSpread(_objectSpread(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".unitPrice"), itemAmount.value.toFixed()), "enhancedSchemeData.itemDetailLine".concat(index + 1, ".totalAmount"), parseFloat(itemAmount.value.toFixed()) + parseFloat(vatAmount.value.toFixed())), "enhancedSchemeData.itemDetailLine".concat(index + 1, ".quantity"), quantity), "enhancedSchemeData.itemDetailLine".concat(index + 1, ".unitOfMeasure"), 'EAC'), commodityCode && _defineProperty({}, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".commodityCode"), commodityCode)), description && _defineProperty({}, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".description"),
    // eslint-disable-next-line no-control-regex
    description.substring(0, 26).replace(/[^\x00-\x7F]/g, ''))), id && _defineProperty({}, "enhancedSchemeData.itemDetailLine".concat(index + 1, ".productCode"), id.substring(0, 12)));
    return _objectSpread(_objectSpread(_objectSpread({}, acc), currentLineItem), {}, {
      'enhancedSchemeData.totalTaxAmount': acc['enhancedSchemeData.totalTaxAmount'] + parseFloat(vatAmount.value.toFixed())
    });
  }, {
    'enhancedSchemeData.totalTaxAmount': 0.0,
    'enhancedSchemeData.customerReference': shopperReference.substring(0, 25)
  });
}
module.exports.getLineItems = getLineItems;