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
var Money = require('dw/value/Money');
var Transaction = require('dw/system/Transaction');
var LineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var PAYPAL_ITEM_CATEGORY = ['PHYSICAL_GOODS', 'DIGITAL_GOODS', 'DONATION'];
function getLineItems(_ref) {
  var order = _ref.Order,
    basket = _ref.Basket;
  if (!(order || basket)) return null;
  var orderOrBasket = order || basket;
  var allLineItems = LineItemHelper.getAllLineItems(orderOrBasket.getAllLineItems());
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

/**
 * @typedef {object} paypalShippingOption
 * @property {string} reference - shipping method id
 * @property {string} description - shipping method displayName
 * @property {('Shipping')} type
 * @property {{currencyCode: String, value: String}} amount
 *          - shipping cost for shipping method including tax
 * @property {boolean} selected - - shipping method is selected
 */

/**
 * @typedef {object} paypalUpdateOrderRequest
 * @property {String} pspReference - the pspReference returned from adyen /payments endpoint
 * @property {String} paymentData - encrypted payment data from paypal component
 * @property {{currencyCode: String, value: String}} amount
 *          - adjustedMerchandizeTotalGrossPrice + adjustedShippingTotalGrossPrice
 * @property {dw.util.ArrayList<paypalShippingOption>} deliveryMethods
 *          - list of paypalShippingOption
 */

/**
 * Returns applicable shipping methods(excluding store pickup methods)
 * for specific Shipment / ShippingAddress pair.
 * @param {String} pspReference - the pspReference returned from adyen /payments endpoint
 * @param {dw.order.basket} currentBasket - a shipment of the current basket
 * @param {dw.util.ArrayList<ApplicableShippingMethodModel>} currentShippingMethods
 *        - a shipment of the current basket
 * @param {String} paymentData - encrypted payment data from paypal component
 * @returns {paypalUpdateOrderRequest} - list of applicable shipping methods or null
 */
function createPaypalUpdateOrderRequest(pspReference, currentBasket, currentShippingMethods, paymentData) {
  var totalGrossPrice = {
    currency: currentBasket.currencyCode,
    value: AdyenHelper.getCurrencyValueForApi(currentBasket.totalGrossPrice).value
  };
  var totalTax = {
    currency: currentBasket.currencyCode,
    value: AdyenHelper.getCurrencyValueForApi(currentBasket.totalTax).value
  };
  var deliveryMethods = currentShippingMethods.map(function (shippingMethod) {
    var _shippingMethod$shipp = shippingMethod.shippingCost,
      currencyCode = _shippingMethod$shipp.currencyCode,
      value = _shippingMethod$shipp.value;
    return {
      reference: shippingMethod.ID,
      description: shippingMethod.displayName,
      type: 'Shipping',
      amount: {
        currency: currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(new Money(value, currencyCode)).value
      },
      selected: shippingMethod.selected
    };
  });
  return {
    pspReference: pspReference,
    paymentData: paymentData,
    amount: totalGrossPrice,
    taxTotal: {
      amount: totalTax
    },
    deliveryMethods: deliveryMethods
  };
}

/**
 * sets Shipping and Billing address for the basket
 * @param {dw.order.Basket} currentBasket - the current basket
 * @returns {undefined}
 */
function setBillingAndShippingAddress(currentBasket) {
  var billingAddress = currentBasket.billingAddress;
  var _currentBasket$getDef = currentBasket.getDefaultShipment(),
    shippingAddress = _currentBasket$getDef.shippingAddress;
  Transaction.wrap(function () {
    if (!shippingAddress) {
      shippingAddress = currentBasket.getDefaultShipment().createShippingAddress();
    }
    if (!billingAddress) {
      billingAddress = currentBasket.createBillingAddress();
    }
  });
  var shopperDetails = JSON.parse(session.privacy.shopperDetails);
  Transaction.wrap(function () {
    billingAddress.setFirstName(shopperDetails.shopperName.firstName);
    billingAddress.setLastName(shopperDetails.shopperName.lastName);
    billingAddress.setAddress1(shopperDetails.billingAddress.street);
    billingAddress.setCity(shopperDetails.billingAddress.city);
    billingAddress.setPhone(shopperDetails.telephoneNumber);
    billingAddress.setPostalCode(shopperDetails.billingAddress.postalCode);
    billingAddress.setStateCode(shopperDetails.billingAddress.stateOrProvince);
    billingAddress.setCountryCode(shopperDetails.billingAddress.country);
    shippingAddress.setFirstName(shopperDetails.shopperName.firstName);
    shippingAddress.setLastName(shopperDetails.shopperName.lastName);
    shippingAddress.setAddress1(shopperDetails.shippingAddress.street);
    shippingAddress.setCity(shopperDetails.shippingAddress.city);
    shippingAddress.setPhone(shopperDetails.telephoneNumber);
    shippingAddress.setPostalCode(shopperDetails.shippingAddress.postalCode);
    shippingAddress.setStateCode(shopperDetails.shippingAddress.stateOrProvince);
    shippingAddress.setCountryCode(shopperDetails.shippingAddress.country);
    currentBasket.setCustomerEmail(shopperDetails.shopperEmail);
  });
}
module.exports = {
  createPaypalUpdateOrderRequest: createPaypalUpdateOrderRequest,
  getLineItems: getLineItems,
  setBillingAndShippingAddress: setBillingAndShippingAddress
};