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
const Money = require('dw/value/Money');
const Transaction = require('dw/system/Transaction');
const LineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

const PAYPAL_ITEM_CATEGORY = ['PHYSICAL_GOODS', 'DIGITAL_GOODS', 'DONATION'];
function getLineItems({ Order: order, Basket: basket }, isExpress) {
  if (!(order || basket)) return null;
  const orderOrBasket = order || basket;
  const allLineItems = LineItemHelper.getAllLineItems(
    orderOrBasket.getAllLineItems(),
  );
  return allLineItems
    .filter(
      // For paypal express the shipping method could be changed in the paypal
      // light box and so the shipping line items are excluded in the initial payments call
      // as lineItems cannot be patched in /paypalUpdateOrder call.
      (lineItem) =>
        !isExpress || !(lineItem instanceof dw.order.ShippingLineItem),
    )
    .map((lineItem) => {
      const lineItemObject = {};
      const description = LineItemHelper.getDescription(lineItem);
      const id = LineItemHelper.getId(lineItem);
      const quantity = LineItemHelper.getQuantity(lineItem);
      const itemAmount =
        LineItemHelper.getItemAmount(lineItem).divide(quantity);
      const vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
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
      // For paypal express tax amount could change based on shipping Address
      // so the tax amount in lineItem is excluded in the initial /Payments call.
      // The final tax would be passed as tax_total in /paypalUpdateOrder call.
      if (!isExpress) {
        lineItemObject.taxAmount = vatAmount.getValue().toFixed();
      }
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
function createPaypalUpdateOrderRequest(
  pspReference,
  currentBasket,
  currentShippingMethods,
  paymentData,
) {
  const totalGrossPrice = {
    currency: currentBasket.currencyCode,
    value: AdyenHelper.getCurrencyValueForApi(currentBasket.totalGrossPrice)
      .value,
  };

  const totalTax = {
    currency: currentBasket.currencyCode,
    value: AdyenHelper.getCurrencyValueForApi(currentBasket.totalTax).value,
  };

  const deliveryMethods = currentShippingMethods.map((shippingMethod) => {
    const { currencyCode, value } = shippingMethod.shippingCost;
    const isSelected = shippingMethod.selected;

    return {
      reference: shippingMethod.ID,
      description: shippingMethod.displayName,
      type: 'Shipping',
      amount: {
        currency: currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(
          isSelected
            ? currentBasket.adjustedShippingTotalNetPrice
            : new Money(value, currencyCode),
        ).value,
      },
      selected: isSelected,
    };
  });

  // Ensure at least one method is selected
  const anySelected = deliveryMethods.some((method) => method.selected);
  if (!anySelected && deliveryMethods.length > 0) {
    deliveryMethods[0].selected = true;
    deliveryMethods[0].amount.value = AdyenHelper.getCurrencyValueForApi(
      currentBasket.adjustedShippingTotalNetPrice,
    ).value;
  }

  return {
    pspReference,
    paymentData,
    amount: totalGrossPrice,
    taxTotal: {
      amount: totalTax,
    },
    deliveryMethods,
  };
}

/**
 * sets Shipping and Billing address for the basket
 * @param {dw.order.Basket} currentBasket - the current basket
 * @param {Object} shopperDetails - the shopper billing and shipping address details
 * @returns {undefined}
 */
function setBillingAndShippingAddress(currentBasket, shopperDetails) {
  let { billingAddress } = currentBasket;
  let { shippingAddress } = currentBasket.getDefaultShipment();
  Transaction.wrap(() => {
    if (!shippingAddress) {
      shippingAddress = currentBasket
        .getDefaultShipment()
        .createShippingAddress();
    }
    if (!billingAddress) {
      billingAddress = currentBasket.createBillingAddress();
    }
  });

  Transaction.wrap(() => {
    billingAddress.setFirstName(
      shopperDetails.billingAddress.shopperName.firstName,
    );
    billingAddress.setLastName(
      shopperDetails.billingAddress.shopperName.lastName,
    );
    billingAddress.setAddress1(shopperDetails.billingAddress.street);
    billingAddress.setCity(shopperDetails.billingAddress.city);
    billingAddress.setPhone(shopperDetails.telephoneNumber);
    billingAddress.setPostalCode(shopperDetails.billingAddress.postalCode);
    billingAddress.setStateCode(
      shopperDetails.billingAddress.stateOrProvince || '',
    );
    billingAddress.setCountryCode(shopperDetails.billingAddress.country);

    shippingAddress.setFirstName(
      shopperDetails.shippingAddress.shopperName.firstName,
    );
    shippingAddress.setLastName(
      shopperDetails.shippingAddress.shopperName.lastName,
    );
    shippingAddress.setAddress1(shopperDetails.shippingAddress.street);
    shippingAddress.setCity(shopperDetails.shippingAddress.city);
    shippingAddress.setPhone(shopperDetails.telephoneNumber);
    shippingAddress.setPostalCode(shopperDetails.shippingAddress.postalCode);
    shippingAddress.setStateCode(
      shopperDetails.shippingAddress.stateOrProvince || '',
    );
    shippingAddress.setCountryCode(shopperDetails.shippingAddress.country);

    currentBasket.setCustomerEmail(shopperDetails.shopperEmail);
  });
}

module.exports = {
  createPaypalUpdateOrderRequest,
  getLineItems,
  setBillingAndShippingAddress,
};
