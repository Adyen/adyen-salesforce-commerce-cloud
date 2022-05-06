'use strict';
/**
*   This script creates new ProductLineItems and Shipments from the
*   FormList of the address selections with help of a data structure
*   (address and product relations through HashMaps).
*
*   @input CBasket : dw.order.Basket The current basket object.
*   @input QuantityLineItems : dw.web.FormList Quantity Line Items from address selection.
*
*/

var checkoutUtils = require('app_storefront_core/cartridge/scripts/checkout/Utils.ds');
var ArrayList = require('dw/util/ArrayList');
var UUIDUtils = require('dw/util/UUIDUtils');

function execute(pdict) {
    var basket = pdict.CBasket;
    var quantityLineItemList = pdict.QuantityLineItems;
    var bonusDiscountLineItems = basket.getBonusDiscountLineItems();
    var bonusDiscountLineItem;
    if (bonusDiscountLineItems.length) {
        bonusDiscountLineItem = bonusDiscountLineItems[0];
    }
    var addressProductRelations = createAddressProductRelations(quantityLineItemList);
    destroyProductLineItems(basket);
    removeNonDefaultShipments(basket);
    createNewShipmentsAndProductLineItems(addressProductRelations, bonusDiscountLineItem, basket);

    return PIPELET_NEXT;
}

function createAddressProductRelations(quantityLineItemList) {
    var addressRelations = {};
    var productRelations;
    for (var i = 0; i < quantityLineItemList.getChildCount(); i++) {

        var quantityLineItem = quantityLineItemList[i];
        var selectedAddress = quantityLineItem.addressList.selectedOptionObject;
        var addressId = selectedAddress.ID ? selectedAddress.ID : quantityLineItem.addressList.selectedOptionObject.UUID;
        var productID = quantityLineItem.object.productID;
        var productOptionID = quantityLineItem.object.optionID;
        var isBonusProduct = quantityLineItem.object.bonusProductLineItem;

        var uniqueId = 'uniqueProductIdentifier' + productID + productOptionID;

        var product = {
            productID: productID,
            productOptionID: productOptionID,
            isBonusProduct: isBonusProduct,
            quantity: 1
        };

        if (selectedAddress === null) {
            return PIPELET_ERROR;
        }

        var addressGroup = addressRelations[addressId];
        if (addressGroup) {
            productRelations = addressGroup.lineItems;
            if (productRelations[uniqueId]) {
                productRelations[uniqueId].quantity += 1;
            } else {
                productRelations[uniqueId] = product;
            }
        } else {
            addressRelations[addressId] = {};
            addressRelations[addressId].address = selectedAddress;
            addressRelations[addressId].lineItems = {};
            addressRelations[addressId].lineItems[uniqueId] = product;
        }
    }

    return addressRelations;
}

function destroyProductLineItems(basket) {
    var productLineItems = basket.getProductLineItems();
    var productLineItem;
    for (var m = 0; m < productLineItems.length; m++) {
        productLineItem = productLineItems[m];
        if (!productLineItem.custom.fromStoreId) {
            basket.removeProductLineItem(productLineItem);
        }
    }
}

function removeNonDefaultShipments(basket) {
    var shipments = basket.getShipments();
    var shipment;
    for (var l = 0; l < shipments.length; l++) {
        shipment = shipments[l];
        //If the shipment is for a gift certificate or the default shipment, it is not removed from the cart.
        if (!shipment.isDefault() && (shipment.giftCertificateLineItems.length <= 0) && shipment.custom.shipmentType !== 'instore') {
            basket.removeShipment(shipment);
        }
    }
}

function createNewShipmentsAndProductLineItems(addressRelations, bonusDiscountLineItem, basket) {
    // Build new ProductLineItems and Shipments with the new created data structure
    var addressIds = Object.keys(addressRelations);
    var shipment;
    var isDefaultShippingSet = false;
    var productLineItem;

    for (var x = 0; x < addressIds.length; x++) {
        var addressID = addressIds[x];
        var address = addressRelations[addressID].address;
        var orderAddress;
        if (!isDefaultShippingSet) {
            shipment = basket.getDefaultShipment();
            isDefaultShippingSet = true;
        } else {
            shipment = basket.createShipment(address.UUID);
        }
        orderAddress = shipment.createShippingAddress();
        // type: Object
        var shippingAddress =  new checkoutUtils.ShippingAddress();
        shippingAddress.UUID = UUIDUtils.createUUID();
        shippingAddress.copyFrom(address);
        shippingAddress.copyTo(orderAddress);

        var productRelations = addressRelations[addressID].lineItems;
        var products = Object.keys(productRelations);

        var productId = '';
        var optionID = '';
        var isProductBonus;

        for (var n = 0; n < products.length; n++) {
            var product = products[n];
            productId = productRelations[product].productID;
            optionID = productRelations[product].productOptionID;
            isProductBonus = productRelations[product].isBonusProduct;

            if (isProductBonus === true) {
                var productToAdd;
                for (var j = 0; j < bonusDiscountLineItem.bonusProducts.length; j++) {
                    if (bonusDiscountLineItem.bonusProducts[j].ID === productId) {
                        productToAdd = bonusDiscountLineItem.bonusProducts[j];
                        break;
                    }
                    if (bonusDiscountLineItem.bonusProducts[j].master) {
                        for (var w = 0; w < bonusDiscountLineItem.bonusProducts[j].variants.length; w++) {
                            if (bonusDiscountLineItem.bonusProducts[j].variants[w].ID === productId) {
                                productToAdd = bonusDiscountLineItem.bonusProducts[j].variants[w];
                                break;
                            }
                        }
                        break;
                    }
                }
                productLineItem = basket.createBonusProductLineItem(bonusDiscountLineItem, productToAdd, null, shipment);

            } else {
                productLineItem = basket.createProductLineItem(productId, shipment);
                productLineItem.setQuantityValue(productRelations[product].quantity);
            }

            //re-assign the option product based on the optionID
            if (optionID !== 'na') {
                // type: dw.catalog.ProductOptionModel
                var productOptionModel = productLineItem.product.getOptionModel();
                // type: dw.catalog.ProductOption
                var productOptions = productOptionModel.getOptions();
                var pliOptionArrayList = new ArrayList(productOptions);
                var productOption = pliOptionArrayList[0];

                // type: Iterator
                var options = productOptionModel.getOptionValues(productOption).iterator();
                while (options.hasNext()) {

                    var optionValue = options.next();

                    // if the option id equals the selection option id, set the selected option
                    if (optionValue.getID() === optionID) {
                        var pliOptionProducts = new ArrayList(productLineItem.optionProductLineItems);

                        for (var k = 0; k < pliOptionProducts.length; k++) {
                            pliOptionProducts[k].updateOptionValue(optionValue);
                        }
                    }
                }
            }
        }
    }
}

module.exports = {
    execute: execute
};
