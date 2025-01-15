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
 */

var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var __LineItemHelper = {
  getDescription: function getDescription(lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem) {
      return lineItem.getID();
    }
    if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.productName;
    }
    if (lineItem instanceof dw.order.PriceAdjustment) {
      return 'Discount';
    }
    return null;
  },
  getId: function getId(lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem || lineItem instanceof dw.order.PriceAdjustment) {
      return lineItem.UUID;
    }
    if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.productID;
    }
    return null;
  },
  getQuantity: function getQuantity(lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem) {
      return '1';
    }
    if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.quantityValue.toFixed();
    }
    if (lineItem instanceof dw.order.PriceAdjustment) {
      return lineItem.quantity.toFixed();
    }
    return null;
  },
  getVatPercentage: function getVatPercentage(lineItem) {
    var vatPercentage = 0;
    if (__LineItemHelper.getVatAmount(lineItem).value !== 0) {
      vatPercentage = lineItem.getTaxRate();
    }
    return vatPercentage;
  },
  getVatAmount: function getVatAmount(lineItem) {
    if (lineItem instanceof dw.order.ProductLineItem || lineItem instanceof dw.order.ShippingLineItem) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.getAdjustedTax());
    }
    if (lineItem instanceof dw.order.PriceAdjustment && lineItem.getPromotion().getPromotionClass() !== 'ORDER') {
      return AdyenHelper.getCurrencyValueForApi(lineItem.tax);
    }
    return new dw.value.Money(0, lineItem.getTax().getCurrencyCode());
  },
  getItemAmount: function getItemAmount(lineItem) {
    if (lineItem instanceof dw.order.ProductLineItem || lineItem instanceof dw.order.ShippingLineItem) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.adjustedNetPrice);
    }
    if (lineItem instanceof dw.order.PriceAdjustment) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.netPrice);
    }
    return new dw.value.Money(0, lineItem.getPrice().getCurrencyCode());
  },
  isProductLineItem: function isProductLineItem(lineItem) {
    return lineItem instanceof dw.order.ProductLineItem;
  },
  isBonusProductLineItem: function isBonusProductLineItem(lineItem) {
    return lineItem.bonusProductLineItem;
  },
  isShippingLineItem: function isShippingLineItem(lineItem) {
    return lineItem instanceof dw.order.ShippingLineItem;
  },
  isPriceAdjustment: function isPriceAdjustment(lineItem) {
    return lineItem instanceof dw.order.PriceAdjustment;
  },
  isValidLineItem: function isValidLineItem(lineItem) {
    return this.isProductLineItem(lineItem) && !this.isBonusProductLineItem(lineItem) || this.isShippingLineItem(lineItem) || this.isPriceAdjustment(lineItem) && lineItem.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER;
  },
  getAllLineItems: function getAllLineItems(allLineItems) {
    var lineItems = [];
    // eslint-disable-next-line no-restricted-syntax
    for (var item in allLineItems) {
      if (item) {
        var lineItem = allLineItems[item];
        if (this.isValidLineItem(lineItem)) {
          lineItems.push(lineItem);
        }
      }
    }
    return lineItems;
  }
};
module.exports = __LineItemHelper;