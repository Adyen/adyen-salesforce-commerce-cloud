'use strict';
/**
 * Model for cart functionality. Creates a CartModel class with payment, shipping, and product
 * helper methods.
 * @module models/CartModel
 */
var Transaction = require('dw/system/Transaction');

/* API Includes */
var AbstractModel = require('./AbstractModel');
var ArrayList = require('dw/util/ArrayList');
var BasketMgr = require('dw/order/BasketMgr');
var Money = require('dw/value/Money');
var MultiShippingLogger = dw.system.Logger.getLogger('multishipping');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Product = require('~/cartridge/scripts/models/ProductModel');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var ProductListMgr = require('dw/customer/ProductListMgr');
var QuantityLineItem = require('~/cartridge/scripts/models/QuantityLineItemModel');
var Resource = require('dw/web/Resource');
var ShippingMgr = require('dw/order/ShippingMgr');
var StoreMgr = require('dw/catalog/StoreMgr');
var TransientAddress = require('~/cartridge/scripts/models/TransientAddressModel');
var UUIDUtils = require('dw/util/UUIDUtils');

var lineItem;
var app = require('~/cartridge/scripts/app');
var ProductList = app.getModel('ProductList');

/**
 * Cart helper providing enhanced cart functionality
 * @class module:models/CartModel~CartModel
 * @extends module:models/AbstractModel
 *
 * @param {dw.order.Basket} obj The basket object to enhance/wrap.
 */
var CartModel = AbstractModel.extend({
    /** @lends module:models/CartModel~CartModel.prototype */
    /**
     * Triggers the cart calculation by executing the hook 'dw.ocapi.shop.basket.calculate'.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/calculate
     * @return {dw.system.Status} Returns OK if cart when the cart is recalculated.
     */
    calculate: function () {
        dw.system.HookMgr.callHook('dw.ocapi.shop.basket.calculate', 'calculate', this.object);
    },

    addProductToCart: function() {
        var cart = this;
        var params = request.httpParameterMap;
        var format = params.hasOwnProperty('format') && params.format.stringValue ? params.format.stringValue.toLowerCase() : '';
        var newBonusDiscountLineItem;
        var Product = app.getModel('Product');
        var productOptionModel;
        var productToAdd;
        var template = 'checkout/cart/minicart';

        // Edit details of a gift registry
        if (params.source && params.source.stringValue === 'giftregistry' && params.cartAction && params.cartAction.stringValue === 'update') {
            ProductList.replaceProductListItem();
            return {
                source: 'giftregistry'
            };
        }

        if (params.source && params.source.stringValue === 'wishlist' && params.cartAction && params.cartAction.stringValue === 'update') {
            app.getController('Wishlist').ReplaceProductListItem();
            return;
        }

        // Updates a product line item.
        if (params.uuid.stringValue) {
            var lineItem = cart.getProductLineItemByUUID(params.uuid.stringValue);
            if (lineItem) {
                var productModel = Product.get(params.pid.stringValue);
                var quantity = parseInt(params.Quantity.value);

                productToAdd = productModel.object;
                productOptionModel = productModel.updateOptionSelection(params);

                Transaction.wrap(function () {
                    cart.updateLineItem(lineItem, productToAdd, quantity, productOptionModel);
                });

                if (format === 'ajax') {
                    template = 'checkout/cart/refreshcart';
                }
            } else {
                return {
                    template: 'checkout/cart/cart'
                };
            }
        // Adds a product from a product list.
        } else if (params.plid.stringValue) {
            var productList = ProductListMgr.getProductList(params.plid.stringValue);
            if (productList) {
                cart.addProductListItem(productList.getItem(params.itemid.stringValue), params.Quantity.doubleValue);
            }

        // Adds a product.
        } else {
            var previousBonusDiscountLineItems = cart.getBonusDiscountLineItems();
            productToAdd = Product.get(params.pid.stringValue);

            if (productToAdd.object.isProductSet()) {
                var childPids = params.childPids.stringValue.split(',');
                var childQtys = params.childQtys.stringValue.split(',');
                var counter = 0;

                for (var i = 0; i < childPids.length; i++) {
                    var childProduct = Product.get(childPids[i]);

                    if (childProduct.object && !childProduct.isProductSet()) {
                        var childProductOptionModel = childProduct.updateOptionSelection(params);
                        cart.addProductItem(childProduct.object, parseInt(childQtys[counter]), childProductOptionModel);
                    }
                    counter++;
                }
            } else {
                productOptionModel = productToAdd.updateOptionSelection(params);
                cart.addProductItem(productToAdd.object, params.Quantity.doubleValue, productOptionModel);
            }

            // When adding a new product to the cart, check to see if it has triggered a new bonus discount line item.
            newBonusDiscountLineItem = cart.getNewBonusDiscountLineItem(previousBonusDiscountLineItems);
        }

        return {
            format: format,
            template: template,
            BonusDiscountLineItem: newBonusDiscountLineItem
        };
    },

    /**
     * Adds a product list item to the cart and recalculates the cart.
     *
     * @alias module:models/CartModel~CartModel/addProductListItem
     * @transactional
     * @param {dw.customer.ProductListItem} productListItem The product list item whose associated product is added to the basket.
     * @param {Number} quantity The quantity of the product.
     */
    addProductListItem: function (productListItem, quantity) {

        if (productListItem) {
            var cart = this;

            Transaction.wrap(function () {
                var shipment = cart.object.defaultShipment;
                cart.createProductLineItem(productListItem, shipment).setQuantityValue(quantity);

                cart.calculate();
            });
        }
    },

    /**
     * Adds a product to the cart and recalculates the cart.
     * By default, when a bundle is added to cart, all its child products are added too, but if those products are
     * variants then the code must replace the master products with the selected variants that are passed in the
     * HTTP params as childPids along with any options.
     * @params {request.httpParameterMap.childPids} - comma separated list of
     * product IDs of the bundled products that are variations.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/addProductItem
     * @param {String} pid - ID of the product that is to be added to the basket.
     * @param {Number} quantity - The quantity of the product.
     * @param {dw.catalog.ProductOptionModel} productOptionModel - The option model of the product that is to be added to the basket.
     */
    addProductItem: function (product, quantity, productOptionModel) {
        var cart = this;
        Transaction.wrap(function () {
            var i;
            if (product) {
                var productInCart;
                var productLineItem;
                var productLineItems = cart.object.productLineItems;
                var quantityInCart;
                var quantityToSet;
                var shipment = cart.object.defaultShipment;

                for (var q = 0; q < productLineItems.length; q++) {
                    if (productLineItems[q].productID === product.ID) {
                        productInCart = productLineItems[q];
                        break;
                    }
                }

                if (productInCart) {
                    if (productInCart.optionModel) {
                        productLineItem = cart.createProductLineItem(product, productOptionModel, shipment);
                        if (quantity) {
                            productLineItem.setQuantityValue(quantity);
                        }
                    } else {
                        quantityInCart = productInCart.getQuantity();
                        quantityToSet = quantity ? quantity + quantityInCart : quantityInCart + 1;
                        productInCart.setQuantityValue(quantityToSet);
                    }
                } else {
                    productLineItem = cart.createProductLineItem(product, productOptionModel, shipment);

                    if (quantity) {
                        productLineItem.setQuantityValue(quantity);
                    }
                }

                /**
                 * By default, when a bundle is added to cart, all its child products are added too, but if those products are
                 * variants then the code must replace the master products with the selected variants that get passed in the
                 * HTTP params as childPids along with any options. Params: CurrentHttpParameterMap.childPids - comma separated list of
                 * pids of the bundled products that are variations.
                 */
                if (request.httpParameterMap.childPids.stringValue && product.bundle) {
                    var childPids = request.httpParameterMap.childPids.stringValue.split(',');

                    for (i = 0; i < childPids.length; i++) {
                        var childProduct = Product.get(childPids[i]).object;

                        if (childProduct) {
                            childProduct.updateOptionSelection(request.httpParameterMap);

                            var foundLineItem = this.getBundledProductLineItemByPID(lineItem, childProduct.isVariant() ? childProduct.masterProduct.ID : childProduct.ID);

                            if (foundLineItem) {
                                foundLineItem.replaceProduct(childProduct);
                            }
                        }
                    }
                }
                cart.calculate();
            }
        });
    },

    /**
     * Validates the supplied coupon code and if the coupon code is valid, applies the coupon code to the basket.
     * While applying the coupon code the function adds a new CouponLineItem to the basket, based on the supplied coupon code.
     * The coupon code gets set at the CouponLineItem.
     *
     * A coupon code can be invalid for the following reasons:
     *  <ul>
     *  <li>The coupon code was already added to the basket.</li>
     *  <li>A coupon code of the same coupon is already in basket. Adding a single coupon code of this coupon is sufficient to enable a promotion.
     *  Adding another coupon code of the same coupon does not make sense, since the promotion is already enabled by the previously added code.</li>
     *  <li>The number of redemptions of this coupon code is 1 and the code was already redeemed.</li>
     *  <li>The number of redemptions of this coupon code is > 1 and the maximum numbers of redemptions of this coupon code was already reached.
     *  The calculation of the redemptions is based on the number of redemptions of this coupon code in past plus
     * the number of redemptions of other coupon codes of the same coupon in the past.</li>
     *  <li>The maximum number of times this coupon can be redeemed per customer was already reached.</li>
     *  <li>The maximum number of times this coupon can be redeemed by a customer within a given time period was already reached.
     *  The calculation of the redemptions is based on the the number of redemptions of this coupon code in past plus the number of redemptions
     *  of other coupon codes of the same coupon in the past.</li>
     *  <li>The coupon code is unknown to the system.</li>
     *  <li>The coupon is not enabled.</li>
     *  <li>There exists no active promotion to which the coupon is assigned.</li>
     *  </ul>
     * In this case, no CouponLineItem is added to the basket and the returned "Status" object contains the details of
     * why the coupon was invalid.
     *
     * Status: The status object representing a detailed result of the operation. The
     * status property (Status.status) is set to 0 if the coupon was successfully applied or 1 otherwise.
     *
     * The code property (Status.code) is set to one of the following values:
     *  <ul>
     *  <li>"OK" = The coupon was applied to the basket.</li>
     *  <li>CouponStatusCodes.COUPON_CODE_ALREADY_IN_BASKET = Indicates that coupon code was already added to the basket.</li>
     *  <li>CouponStatusCodes.COUPON_ALREADY_IN_BASKET = Indicates that another code of the same MultiCode/System coupon was already added to basket.</li>
     *  <li>CouponStatusCodes.COUPON_CODE_ALREADY_REDEEMED = Indicates that code of MultiCode/System coupon was already redeemed.</li>
     *  <li>CouponStatusCodes.COUPON_CODE_UNKNOWN = Indicates that coupon not found for given coupon code or that the code itself was not found.</li>
     *  <li>CouponStatusCodes.COUPON_DISABLED = Indicates that coupon is not enabled.</li>
     *  <li>CouponStatusCodes.REDEMPTION_LIMIT_EXCEEDED = Indicates that number of redemptions per code exceeded.</li>
     *  <li>CouponStatusCodes.CUSTOMER_REDEMPTION_LIMIT_EXCEEDED = Indicates that number of redemptions per code and customer exceeded.</li>
     *  <li>CouponStatusCodes.TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED = Indicates that number of redemptions per code, customer and time exceeded.</li>
     *  <li>CouponStatusCodes.NO_ACTIVE_PROMOTION = Indicates that coupon is not assigned to an active promotion.</li>
     * </ul>
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/addCoupon
     * @param {String} couponCode - The code of the coupon to add.
     * @returns {dw.system.Status} The "Status" object containing details of the add to cart action.
     */
    addCoupon: function (couponCode) {
        if (couponCode) {
            var cart = this;
            var campaignBased = true;
            var addCouponToBasketResult;

            try {
                addCouponToBasketResult = Transaction.wrap(function () {
                    return cart.object.createCouponLineItem(couponCode, campaignBased);
                });
            } catch (e) {
                return {CouponStatus: e.errorCode};
            }

            Transaction.wrap(function (){
                cart.calculate();
            });
            return {CouponStatus: addCouponToBasketResult.statusCode};
        }
    },

    /**
     * Adds a bonus product to the cart associated with the specified BonusDiscountLineItem. The function creates
     * and returns a ProductLineItem by assigning the specified Product and Quantity to the cart. The function adds
     * the new ProductLineItem to the default shipment.
     * The product parameter must be one of the products associated with the BonusDiscountLineItem or the process
     * fails. The process does not validate if the number of bonus products exceeds the maximum allowed by the bonus
     * discount. This is the job of application logic.
     * The function always creates a new product line item, regardless of the value of the site preference
     * 'Add Product Behavior'.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/addBonusProduct
     * @param {dw.order.BonusDiscountLineItem} bonusDiscountLineItem - Line item representing an applied BonusChoiceDiscount in the basket. The
     * product must be in the bonus product list of this discount.
     * @param {dw.catalog.Product} product - The product that is to be added to the basket.
     * @param {dw.util.ArrayList} selectedOptions - Product option array of optionName/optionValue pairs.
     *
     *
     * @returns {dw.order.ProductLineItem} The newly created product line item.
     */
    addBonusProduct: function (bonusDiscountLineItem, product, selectedOptions, quantity) {
        // TODO: Should this actually be using the dw.catalog.ProductOptionModel.UpdateProductOptionSelections method instead?
        var UpdateProductOptionSelections = require('app_storefront_core/cartridge/scripts/cart/UpdateProductOptionSelections');
        var ScriptResult = UpdateProductOptionSelections.update({
            SelectedOptions: selectedOptions,
            Product: product
        });
        var shipment = null;
        var productLineItem = this.object.createBonusProductLineItem(bonusDiscountLineItem, product, ScriptResult, shipment);

        if (quantity) {
            productLineItem.setQuantityValue(quantity);
        }

        return productLineItem;
    },

    /**
     * Deletes all the products associated with a bonus discount line item.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/removeBonusDiscountLineItemProducts
     * @param {dw.order.BonusDiscountLineItem} bonusDiscountLineItem - The bonus discount line item to remove the
     * product line items for.
     */
    removeBonusDiscountLineItemProducts: function (bonusDiscountLineItem) {
        // TODO - add check whether the given line item actually belongs to this cart object.
        var plis = bonusDiscountLineItem.getBonusProductLineItems();

        for (var i = 0; i < plis.length; i++) {
            var pli = plis[i];
            if (pli.product) {
                this.removeProductLineItem(pli);
            }
        }
    },

    /**
     * Returns the product line item of the cart with a specific UUID.
     *
     * @alias module:models/CartModel~CartModel/getProductLineItemByUUID
     * @param {String} lineItemUUID - The UUID of the line item.
     * @returns {dw.order.ProductLineItem} The product line item or null if not found.
     */
    getProductLineItemByUUID: function (lineItemUUID) {
        var plis = this.getProductLineItems();
        var lineItem = null;

        for (var i = 0, il = plis.length; i < il; i++) {
            var item = plis[i];
            if ((lineItemUUID && item.UUID === lineItemUUID)) {
                lineItem = item;
                break;
            }
        }

        return lineItem;
    },

    /**
     * Searches a bundle line item for a product line item with a specific product ID.
     * @alias module:models/CartModel~CartModel/getBundledProductLineItemByPID
     * @param {dw.order.ProductLineItem} bundleLineItem - The bundle product line item, which contains two or more product line items.
     * @param {String} pid - The product identifier of the product line item to find.
     * @returns {dw.order.ProductLineItem} The product line item or null if not found.
     */
    getBundledProductLineItemByPID: function (bundleLineItem, pid) {
        // TODO - add check whether the given line item actually belongs to this cart object
        var plis = bundleLineItem.getBundledProductLineItems();
        var lineItem = null;

        for (var i = 0, il = plis.length; i < il; i++) {
            var item = plis[i];
            if ((pid && item.productID === pid)) {
                lineItem = item;
                break;
            }
        }

        return lineItem;
    },

    /**
     * Returns the bonus discount line item of the cart having the given UUID.
     *
     * @alias module:models/CartModel~CartModel/getBonusDiscountLineItemByUUID
     * @param {String} lineItemUUID - The UUID of the bonus discount line item.
     * @returns {dw.order.BonusDiscountLineItem} The bonus discount line item or null if not found.
     */
    getBonusDiscountLineItemByUUID: function (lineItemUUID) {
        var plis = this.getBonusDiscountLineItems();
        var lineItem = null;

        for (var i = 0, il = plis.length; i < il; i++) {
            var item = plis[i];
            if ((lineItemUUID && item.UUID === lineItemUUID)) {
                lineItem = item;
                break;
            }
        }

        return lineItem;
    },

    /**
     * Checks the in-store quantity of all product line items
     * against the store inventory in case the product line item's quantity was
     * updated. If the store inventory does not have as many of the item in stock as is being purchased,
     * the product line item is converted from in-store pickup to home delivery.
     * @transactional
     * @alias module:models/CartModel~CartModel/checkInStoreProducts
     */
    checkInStoreProducts: function () {
        if (dw.system.Site.getCurrent().getCustomPreferenceValue('enableStorePickUp')) {

            var allProductLineItems = this.getAllProductLineItems();
            for (var i = 0; i < allProductLineItems.length; i++) {
                var pli = allProductLineItems[i];

                //Skip product line items that are not in-store.
                if (pli.custom.fromStoreId) {
                    //Check the quantity against the inventory of the store with matching storeID,
                    //if the cart is being updated with a new quantity.
                    var store = StoreMgr.getStore(pli.custom.fromStoreId);
                    var storeinventory = ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);

                    if (storeinventory.getRecord(pli.productID).ATS.value >= pli.quantityValue) {
                        pli.custom.fromStoreId = store.ID;
                        pli.setProductInventoryList(storeinventory);

                    } else {
                        //The in-store line item is reset to a regular home delivery item.
                        pli.custom.fromStoreId = '';
                        pli.setProductInventoryList(null);
                        pli.setShipment(this.getDefaultShipment());
                    }
                }
            }
        }
    },

    /**
     * Checks to see if a new bonus discount line item was created by providing a list of 'previous' discount
     * line items.
     *
     * @alias module:models/CartModel~CartModel/getNewBonusDiscountLineItems
     * @param {dw.util.Collection} previousBonusDiscountLineItems - Baseline collection of bonus discount line items.
     * @returns {dw.order.BonusDiscountLineItem} The newly created bonus discount line item.
     */
    getNewBonusDiscountLineItem: function (previousBonusDiscountLineItems) {
        var newBonusDiscountLineItems = this.getBonusDiscountLineItems();
        var newBonusDiscountLineItem;

        var iter = newBonusDiscountLineItems.iterator();
        while (iter.hasNext()) {
            var newItem = iter.next();
            // if there is a new discount line item, return it right away
            if (!previousBonusDiscountLineItems.contains(newItem)) {
                newBonusDiscountLineItem = newItem;
                break;
            }
        }
        return newBonusDiscountLineItem;
    },

    /**
     * Replaces the current product of the specified product line item with the specified product.
     *
     * By default, when a bundle is added to a cart, all its child products are added as well.
     * However, if those products are variants then the master products must be replaced
     * with the selected variants that get passed in the CurrentHttpParameterMap.childPids as comma separated list of
     * pids of the bundled products that are variations and any options.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/updateLineItem
     * @param {dw.order.ProductLineItem} lineItem - The product line item to replace.
     * @param {dw.catalog.Product} product - The new product.
     * @param {Number} quantity - The quantity of the product line item after replacement.
     * @param {dw.catalog.ProductOptionModel} productOptionModel - The option model of the product to add to the basket.
     */
    updateLineItem: function (lineItem, product, quantity, productOptionModel) {
        var optionValues = productOptionModel.getOptions();

        lineItem.replaceProduct(product);
        lineItem.setQuantityValue(quantity);

        if (optionValues.length) {
            lineItem.updateOptionValue(optionValues[0]);
        }

        if (product.isBundle()) {

            if (request.httpParameterMap.childPids.stringValue) {
                var childPids = request.httpParameterMap.childPids.stringValue.split(',');

                for (var i = 0; i < childPids.length; i++) {
                    var childProduct = Product.get(childPids[i]).object;

                    if (childProduct) {
                        // why is this needed ?
                        childProduct.updateOptionSelection(request.httpParameterMap);

                        var foundLineItem = null;
                        foundLineItem = this.getBundledProductLineItemByPID(lineItem, (childProduct.isVariant() ? childProduct.masterProduct.ID : childProduct.ID));

                        if (foundLineItem) {
                            foundLineItem.replaceProduct(childProduct);
                        }
                    }
                }
            }
        }
    },

    /**
     * Implements a typical shopping cart checkout validation. Some parts of the validation script are specific to
     * the reference application logic and might not be applicable to our customer's storefront applications.
     * However, the shopping cart validation script can be customized to meet specific needs and requirements.
     *
     * This function implements the validation of the shopping cart against specific
     * conditions in the following steps:
     * - validate that total price is not N/A
     * - validate that all products in the basket are still in site catalog and online
     * - validate that all coupon codes in the basket are valid
     * - validate that the taxes can be calculated for all products in the basket (if ValidateTax input parameter is true)
     *
     * @alias module:models/CartModel~CartModel/validateForCheckout
     * @returns {dw.system.Status} BasketStatus
     * @returns {Boolean} EnableCheckout
     */
    validateForCheckout: function () {
        var ValidateCartForCheckout = require('app_storefront_core/cartridge/scripts/cart/ValidateCartForCheckout');
        return ValidateCartForCheckout.validate({
            Basket: this.object,
            ValidateTax: false
        });
    },

    /**
     * The function removes all empty shipments of the current cart.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/removeEmptyShipments
     */
    removeEmptyShipments: function () {
        var that = this;
        // Gets the list of shipments.
        var shipments = that.getShipments();

        dw.system.Transaction.wrap(function () {
            for (var i = 0; i < shipments.length; i++) {
                var shipment = shipments[i];

                if (!shipment.isDefault()) {
                    if (shipment.getProductLineItems().isEmpty() && shipment.getGiftCertificateLineItems().isEmpty()) {
                        that.removeShipment(shipment);
                    }
                }
            }
        });
    },

    /**
     * Determines the physical shipments of the current cart. Physical shipments are shipments that contain at
     * least one product line item. A shipment that contains only gift certificates is not a physical shipment.
     * Product line items marked for in-store pickup are also not considered physical shipments.
     *
     * @alias module:models/CartModel~CartModel/getPhysicalShipments
     * @returns {dw.util.ArrayList} List of physical shipments.
     */
    getPhysicalShipments: function () {

        // list of physical shipments
        var physicalShipments = new ArrayList();

        // find physical shipments
        var shipments = this.getShipments();

        for (var i = 0; i < shipments.length; i++) {
            var shipment = shipments[i];
            if (!shipment.getProductLineItems().isEmpty() && shipment.custom.shipmentType !== 'instore') {
                physicalShipments.add(shipment);
            }
        }

        return physicalShipments;
    },

    /**
     * Cleans the shipments of the current basket by putting all gift certificate line items to single, possibly
     * new, shipments, with one shipment per gift certificate line item.
     *
     * @alias module:models/CartModel~CartModel/updateGiftCertificateShipments
     * @transactional
     */
    updateGiftCertificateShipments: function () {

        // List of line items.
        var giftCertificatesLI = new ArrayList();

        // Finds gift certificates in shipments that have
        // product line items and gift certificate line items merged.
        var shipments = this.getShipments();

        for (var i = 0; i < shipments.length; i++) {
            var shipment = shipments[i];

            // Skips shipment if no gift certificates are contained.
            if (shipment.giftCertificateLineItems.size() === 0) {
                continue;
            }

            // Skips shipment if it has no products and just one gift certificate is contained.
            if (shipment.productLineItems.size() === 0 && shipment.giftCertificateLineItems.size() === 1) {
                continue;
            }

            // If there are gift certificates, add them to the list.
            if (shipment.giftCertificateLineItems.size() > 0) {
                giftCertificatesLI.addAll(shipment.giftCertificateLineItems);
            }
        }

        // Create a shipment for each gift certificate line item.
        for (var n = 0; n < giftCertificatesLI.length; n++) {
            var newShipmentID = this.determineUniqueShipmentID('Shipment #');
            giftCertificatesLI[n].setShipment(this.createShipment(newShipmentID));
        }
    },

    /**
     * Determines a unique shipment ID for shipments in the current cart and the given base ID. The function appends
     * a counter to the base ID and checks the existence of the resulting ID. If the resulting ID is unique, this ID
     * is returned; if not, the counter is incremented and checked again.
     *
     * @alias module:models/CartModel~CartModel/determineUniqueShipmentID
     * @param {String} baseID - The base ID.
     * @returns {String} Calculated shipment ID.
     */
    determineUniqueShipmentID: function (baseID) {
        var counter = 1;
        var shipment = null;
        var candidateID = baseID + '' + counter;

        while (shipment === null) {
            shipment = this.getShipment(candidateID);
            if (shipment) {
                // This ID is already taken, increment the counter
                // and try the next one.
                counter++;
                candidateID = baseID + '' + counter;
                shipment = null;
            } else {
                return candidateID;
            }
        }

        // Should never go here
        return null;
    },

    /**
     * Creates a shipping address for the shipment with the given shipment ID.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/createShipmentShippingAddress
     * @param {String} shipmentID - The ID of the shipment to create the shipping address for.
     * @returns {dw.order.OrderAddress} The created shipping address.
     */
    createShipmentShippingAddress: function (shipmentID) {

        var shipment = this.getShipment(shipmentID);
        var shippingAddress = shipment.getShippingAddress();

        // If the shipment has no shipping address yet, create one.
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }

        return shippingAddress;

    },

    /**
     * Scans the basket and consolidates items that are going to the same store. It also creates shipments
     * with shipment type and method for the rest of checkout.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/consolidateInStoreShipments
     * @returns {boolean} true if there is a home delivery found in the basket, false otherwise.
     */
    consolidateInStoreShipments: function () {
        var sliArrayList = new ArrayList();
        var homeDeliveries = false;
        var storeObject, shippingAddress, orderAddress;

        var plis = this.getAllProductLineItems();
        for (var i = 0; i < plis.length; i++) {
            var pli = plis[i];

            if (pli.custom.fromStoreId === null) {
                //Skips line items that are not in-store product line items.
                homeDeliveries = true;
                continue;
            }
            if (pli.shipment.shippingMethod && pli.shipment.shippingMethod.custom.storePickupEnabled) {
                //Checks to see if the store id changed.
                if (pli.custom.fromStoreId === pli.shipment.custom.fromStoreId) {
                    if (pli.shipment.shippingAddress) {
                        continue;
                    } else {
                        //Creates the shipment address to reflect the new store address.
                        shippingAddress = new TransientAddress();
                        storeObject = StoreMgr.getStore(pli.custom.fromStoreId);
                        orderAddress = pli.shipment.createShippingAddress();
                        shippingAddress.storeAddressTo(orderAddress, storeObject);
                        continue;
                    }
                } else {
                    storeObject = StoreMgr.getStore(pli.custom.fromStoreId);
                    //Changes the shipment address to reflect the new store address.
                    pli.shipment.shippingAddress.setFirstName('');
                    pli.shipment.shippingAddress.setLastName(storeObject.name);
                    pli.shipment.shippingAddress.setAddress1(storeObject.address1);
                    pli.shipment.shippingAddress.setAddress2(storeObject.address2);
                    pli.shipment.shippingAddress.setCity(storeObject.city);
                    pli.shipment.shippingAddress.setPostalCode(storeObject.postalCode);
                    pli.shipment.shippingAddress.setStateCode(storeObject.stateCode);
                    pli.shipment.shippingAddress.setCountryCode(storeObject.custom.countryCodeValue);
                    pli.shipment.shippingAddress.setPhone(storeObject.phone);
                    pli.shipment.custom.fromStoreId = pli.custom.fromStoreId;
                    continue;
                }
            }

            //Checks whether the function is creating a new shipment or adding to an existing one.
            if (sliArrayList.contains(pli.custom.fromStoreId)) {
                //Adds the product line item to the existing shipment.
                //Loops through to find the shipment with the storeid and set it as the shipment for the pli.
                var shipments = this.getShipments();
                for (var j = 0; j < this.getShipments().length; j++) {
                    var inStoreShipment = shipments[j];

                    if (inStoreShipment.custom.fromStoreId && (pli.custom.fromStoreId === inStoreShipment.custom.fromStoreId)) {
                        //If an existing shipment that has the correct address is found.
                        pli.setShipment(inStoreShipment);
                    }

                }

            } else {
                //create a new shipment to put this product line item in
                var shipment = null;
                shipment = this.createShipment(UUIDUtils.createUUID());
                shipment.custom.fromStoreId = pli.custom.fromStoreId;
                shipment.custom.shipmentType = 'instore';

                //Loops over the shipping methods and picks the in-store method.
                var shippingMethods = new ArrayList(ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods());
                for (var k = 0; k < shippingMethods.length; k++) {
                    var shippingMethod = shippingMethods[k];

                    if (shippingMethod.custom.storePickupEnabled) {
                        shipment.setShippingMethod(shippingMethod);
                    }

                }

                shippingAddress = new TransientAddress();
                storeObject = StoreMgr.getStore(pli.custom.fromStoreId);
                orderAddress = shipment.createShippingAddress();
                shippingAddress.storeAddressTo(orderAddress, storeObject);
                pli.setShipment(shipment);

            }

            sliArrayList.add(pli.custom.fromStoreId);
        }

        return homeDeliveries;
    },

    /**
     * Updates the shipping method of the given shipment. If a shipping method ID is given, the given
     * shipping method is used to update the shipment.
     *
     * @alias module:models/CartModel~CartModel/preCalculateShipping
     * @param {dw.order.ShippingMethod} shippingMethod - A shipping method.
     * @returns {Object} Returns the following object:
     * <code><pre>
     * "shippingExclDiscounts"         : this.getShippingTotalPrice(),
     * "shippingInclDiscounts"         : this.getAdjustedShippingTotalPrice(),
     * "productShippingCosts"          : productShippingCosts,
     * "productShippingDiscounts"      : productShippingDiscounts,
     * "shippingPriceAdjustments"      : priceAdjArray,
     * "shippingPriceAdjustmentsTotal" : priceAdjTotal,
     * "surchargeAdjusted"             : adustedSurchargeTotal,
     * "baseShipping"                  : baseShipping,
     * "baseShippingAdjusted"          : baseShippingAdjusted
     * </pre></code>
     */
    preCalculateShipping: function (shippingMethod) {

        var shipment = this.getDefaultShipment();

        if (shipment) {
            var currencyCode = this.getCurrencyCode();
            var productShippingCosts     = [], // array to hold product level shipping costs (fixed or surcharges), each entry is an object containing product name and shipping cost
                productShippingDiscounts = new ArrayList(), // list holds all products shipping discounts NOT promotions e.g. fixed shipping discount or free shipping for individual products discount
                productIter              = this.getAllProductLineItems().iterator(),
                priceAdj,
                priceAdjArray            = [], // array to hold shipping price adjustments data (we have to create objects since price adjustments get lost after applying a shipping method
                priceAdjIter             = shipment.getShippingPriceAdjustments().iterator(),
                priceAdjTotal            = new Money(0.0, currencyCode), // total of all price adjustments
                surchargeTotal           = new Money(0.0, currencyCode), // total of all surcharges
                adustedSurchargeTotal    = new Money(0.0, currencyCode); // total of all surcharges minus price adjustments

            // Iterates over all products in the basket
            // and calculates their shipping cost and shipping discounts
            while (productIter.hasNext()) {
                var pli = productIter.next();
                var product = pli.product;
                if (product) {
                    var psc = ShippingMgr.getProductShippingModel(product).getShippingCost(shippingMethod);
                    productShippingCosts[productShippingCosts.length] = {
                        name: product.name,
                        shippingCost: psc,
                        qty: pli.getQuantity()
                    };
                    if (psc && psc.getAmount() && psc.isSurcharge()) {
                        // update the surcharge totals
                        surchargeTotal = surchargeTotal.add(psc.getAmount());
                        adustedSurchargeTotal = adustedSurchargeTotal.add(psc.getAmount());
                    }
                    //productShippingDiscounts.addAll(discountPlan.getProductShippingDiscounts(pli));
                    //productShippingDiscounts.addAll(pli.shippingLineItem.priceAdjustments);
                    if (pli.shippingLineItem) {
                        var pdiscountsiter = pli.shippingLineItem.priceAdjustments.iterator();
                        while (pdiscountsiter.hasNext()) {
                            priceAdj = pdiscountsiter.next();
                            if (priceAdj && priceAdj.promotion !== null) {
                                if (pli.shippingLineItem.isSurcharge()) {
                                    // adjust the surchage total value
                                    adustedSurchargeTotal = adustedSurchargeTotal.add(priceAdj.price);
                                }
                                productShippingDiscounts.add({
                                    price: priceAdj.price,
                                    calloutMsg: priceAdj.promotion.calloutMsg
                                });
                            }
                        }
                    }
                }
            }

            // Iterates over all shipping price adjustments and
            // grabs price and calloutMsg objects.
            while (priceAdjIter.hasNext()) {
                priceAdj = priceAdjIter.next();
                if (priceAdj && priceAdj.promotion !== null) {
                    priceAdjTotal = priceAdjTotal.add(priceAdj.price);
                    priceAdjArray[priceAdjArray.length] = {
                        price: priceAdj.price,
                        calloutMsg: priceAdj.promotion.calloutMsg
                    };
                }
            }

            var baseShipping = this.getShippingTotalPrice().subtract(surchargeTotal);
            var baseShippingAdjusted = null;
            if (priceAdjTotal >= 0) {
                baseShippingAdjusted = baseShipping.subtract(priceAdjTotal);
            } else {
                baseShippingAdjusted = baseShipping.add(priceAdjTotal);
            }

            return {
                shippingExclDiscounts: this.getShippingTotalPrice(),
                shippingInclDiscounts: this.getAdjustedShippingTotalPrice(),
                productShippingCosts: productShippingCosts,
                productShippingDiscounts: productShippingDiscounts,
                shippingPriceAdjustments: priceAdjArray,
                shippingPriceAdjustmentsTotal: priceAdjTotal,
                surchargeAdjusted: adustedSurchargeTotal,
                baseShipping: baseShipping,
                baseShippingAdjusted: baseShippingAdjusted
            };
        }
    },

    /**
     * Sets the shipping method of the given shipment to the passed method.  The list of allowed shipping
     * methods may be passed in as a parameter.  If not, then it is retrieved using ShipmentShippingModel.getApplicableShippingMetods().
     * If the passed shipping method is not in this list, then the function uses the default shipping method.
     * If the default shipping method is not in the list, the function uses the first method in the list.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/updateShipmentShippingMethod
     * @param {String} shipmentID - The ID of the shipment to update the shipping method for.
     * @param {String} shippingMethodID - The ID of the shipping method to set for the shipment.
     * @param {dw.order.ShippingMethod} shippingMethod - The shipping method to set for the shipment.
     * @param {dw.util.Collection} shippingMethods - The list of applicable shipping methods.
     */
    updateShipmentShippingMethod: function (shipmentID, shippingMethodID, shippingMethod, shippingMethods) {

        var shipment = this.getShipment(shipmentID);

        if (!shippingMethods) {
            shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();
        }

        // Tries to set the shipment shipping method to the passed one.
        for (var i = 0; i < shippingMethods.length; i++) {
            var method = shippingMethods[i];

            if (!shippingMethod) {
                if (!method.ID.equals(shippingMethodID)) {
                    continue;
                }
            } else {
                if (method !== shippingMethod) {
                    continue;
                }

            }

            // Sets this shipping method.
            shipment.setShippingMethod(method);
            return;
        }

        var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
        if (shippingMethods.contains(defaultShippingMethod)) {
            // Sets the default shipping method if it is applicable.
            shipment.setShippingMethod(defaultShippingMethod);
        } else if (shippingMethods.length > 0) {
            // Sets the first shipping method in the applicable list.
            shipment.setShippingMethod(shippingMethods.iterator().next());
        } else {
            // Invalidates the current shipping method selection.
            shipment.setShippingMethod(null);
        }

        return;
    },

    /**
     * Retrieves the list of applicable shipping methods for a given shipment and a full or partial shipping address.
     * A shipping method is applicable if it does not exclude any of the products in the shipment, and does not
     * exclude the specified address.
     *
     * @alias module:models/CartModel~CartModel/getApplicableShippingMethods
     * @param {module:models/TransientAddressModel~TransientAddressModel} address - The address to get the applicable shipping
     * methods for.
     * @returns {dw.util.Collection} The list of applicable shipping methods for the default shipment and the given address.
     */
    getApplicableShippingMethods: function (address) {
        // Modify as needed.
        if (!address.countryCode) {
            address.countryCode = 'US';
        }
        if (!address.stateCode) {
            address.stateCode = 'NY';
        }

        // Retrieves the list of applicable shipping methods for the given shipment and address.
        return ShippingMgr.getShipmentShippingModel(this.getDefaultShipment()).getApplicableShippingMethods(address);
    },

    /**
     * Calculates the amount to be paid by a non-gift certificate payment instrument based on the given basket.
     * The function subtracts the amount of all redeemed gift certificates from the order total and returns this
     * value.
     *
     * @alias module:models/CartModel~CartModel/getNonGiftCertificateAmount
     * @returns {dw.value.Money} The amount to be paid by a non-gift certificate payment instrument.
     */
    getNonGiftCertificateAmount: function () {
        // The total redemption amount of all gift certificate payment instruments in the basket.
        var giftCertTotal = new Money(0.0, this.getCurrencyCode());

        // Gets the list of all gift certificate payment instruments
        var gcPaymentInstrs = this.getGiftCertificatePaymentInstruments();
        var iter = gcPaymentInstrs.iterator();
        var orderPI = null;

        // Sums the total redemption amount.
        while (iter.hasNext()) {
            orderPI = iter.next();
            giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
        }

        // Gets the order total.
        var orderTotal = this.getTotalGrossPrice();

        // Calculates the amount to charge for the payment instrument.
        // This is the remaining open order total that must be paid.
        var amountOpen = orderTotal.subtract(giftCertTotal);

        // Returns the open amount to be paid.
        return amountOpen;
    },

    /**
     * Removes a gift certificate payment instrument with the given gift certificate ID
     * from the basket.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/removeGiftCertificatePaymentInstrument
     * @param {String} giftCertificateID - The ID of the gift certificate to remove the payment instrument for.
     */
    removeGiftCertificatePaymentInstrument: function (giftCertificateID) {

        // Iterates over the list of payment instruments.
        var gcPaymentInstrs = this.getGiftCertificatePaymentInstruments(giftCertificateID);
        var iter = gcPaymentInstrs.iterator();
        var existingPI = null;

        // Remove (one or more) gift certificate payment
        // instruments for this gift certificate ID.
        while (iter.hasNext()) {
            existingPI = iter.next();
            this.removePaymentInstrument(existingPI);
        }

        return;
    },

    /**
     * Deletes multiple payment instruments.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/removePaymentInstruments
     * @param {dw.util.Collection} paymentInstruments - The payment instruments to remove.
     */
    removePaymentInstruments: function (paymentInstruments) {

        for (var i = 0; i < paymentInstruments.length; i++) {
            var pi = paymentInstruments[i];
            this.removePaymentInstrument(pi);
        }

    },

    /**
     * Calculates the total amount of an order paid for by gift certificate payment
     * instruments. Any remaining open amount is applied to the non-gift certificate payment
     * instrument, such as a credit card. <b>Note:</b> this script assumes that only one non-gift certificate
     * payment instrument is used for the payment.
     *
     * @alias module:models/CartModel~CartModel/calculatePaymentTransactionTotal
     * @returns {boolean} false in the case of an error or if the amount of the transaction is not covered, true otherwise.
     */
    calculatePaymentTransactionTotal: function () {

        // Gets all payment instruments for the basket.
        var iter = this.getPaymentInstruments().iterator();
        var paymentInstrument = null;
        var nonGCPaymentInstrument = null;
        var giftCertTotal = new Money(0.0, this.getCurrencyCode());

        // Locates a non-gift certificate payment instrument if one exists.
        while (iter.hasNext()) {
            paymentInstrument = iter.next();
            if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.getPaymentMethod())) {
                giftCertTotal = giftCertTotal.add(paymentInstrument.getPaymentTransaction().getAmount());
                continue;
            }

            // Captures the non-gift certificate payment instrument.
            nonGCPaymentInstrument = paymentInstrument;
            break;
        }

        // Gets the order total.
        var orderTotal = this.getTotalGrossPrice();

        // If a gift certificate payment and non-gift certificate payment
        // instrument are found, the function returns true.
        if (!nonGCPaymentInstrument) {
            // If there are no other payment types and the gift certificate
            // does not cover the open amount, then return false.
            if (giftCertTotal < orderTotal) {
                return false;
            } else {
                return true;
            }
        }

        // Calculates the amount to be charged for the
        // non-gift certificate payment instrument.
        var amount = this.getNonGiftCertificateAmount();

        // now set the non-gift certificate payment instrument total.
        if (amount.value <= 0.0) {
            var zero = new Money(0, amount.getCurrencyCode());
            nonGCPaymentInstrument.getPaymentTransaction().setAmount(zero);
        } else {
            nonGCPaymentInstrument.getPaymentTransaction().setAmount(amount);
        }

        return true;
    },

    /**
     * Creates a list of gift certificate ids from gift certificate payment instruments.
     *
     * @alias module:models/CartModel~CartModel/getGiftCertIdList
     * @returns {dw.util.ArrayList} The list of gift certificate IDs.
     */
    getGiftCertIdList: function () {
        var gcIdList = new ArrayList();
        var gcPIIter = this.getGiftCertificatePaymentInstruments.iterator();

        while (gcPIIter.hasNext()) {
            gcIdList.add((gcPIIter.next()).getGiftCertificateCode());
        }

        return gcIdList;
    },

    /**
     * Verifies whether existing non-gift-certificate payment instrument methods or cards are still applicable.
     * Returns the collection of valid and invalid payment instruments.
     *
     * @alias module:models/CartModel~CartModel/validatePaymentInstruments
     * @param {dw.customer.Customer} customer - The current customer.
     * @param {String} countryCode - The country code.
     * @param {Number} amount - The payment amount.
     *
     * @returns {dw.util.Collection} ValidPaymentInstruments - The collection of valid payment instruments.
     * @returns {dw.util.Collection} InvalidPaymentInstruments - The collection of invalid payment instruments.
     */
    validatePaymentInstruments: function (customer, countryCode, amount) {
        var paymentHelpers = require('~/cartridge/scripts/payment/common');
        return paymentHelpers.validatePaymentInstruments(this, countryCode, amount);
    },

    /**
     * Creates a gift certificate payment instrument from the given gift certificate ID for the basket. The
     * method attempts to redeem the current balance of the gift certificate. If the current balance exceeds the
     * order total, this amount is redeemed and the balance is lowered.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/createGiftCertificatePaymentInstrument
     * @param {dw.order.GiftCertificate} giftCertificate - The gift certificate.
     * @returns {dw.order.PaymentInstrument} The created PaymentInstrument.
     */
    createGiftCertificatePaymentInstrument: function (giftCertificate) {

        // Removes any duplicates.
        // Iterates over the list of payment instruments to check.
        var gcPaymentInstrs = this.getGiftCertificatePaymentInstruments(giftCertificate.getGiftCertificateCode()).iterator();
        var existingPI = null;

        // Removes found gift certificates, to prevent duplicates.
        while (gcPaymentInstrs.hasNext()) {
            existingPI = gcPaymentInstrs.next();
            this.removePaymentInstrument(existingPI);
        }

        // Fetches the balance and the order total.
        var balance = giftCertificate.getBalance();
        var orderTotal = this.getTotalGrossPrice();

        // Sets the amount to redeem equal to the remaining balance.
        var amountToRedeem = balance;

        // Since there may be multiple gift certificates, adjusts the amount applied to the current
        // gift certificate based on the order total minus the aggregate amount of the current gift certificates.

        var giftCertTotal = new Money(0.0, this.getCurrencyCode());

        // Iterates over the list of gift certificate payment instruments
        // and updates the total redemption amount.
        gcPaymentInstrs = this.getGiftCertificatePaymentInstruments().iterator();
        var orderPI = null;

        while (gcPaymentInstrs.hasNext()) {
            orderPI = gcPaymentInstrs.next();
            giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
        }

        // Calculates the remaining order balance.
        // This is the remaining open order total that must be paid.
        var orderBalance = orderTotal.subtract(giftCertTotal);

        // The redemption amount exceeds the order balance.
        // use the order balance as maximum redemption amount.
        if (orderBalance < amountToRedeem) {
            // Sets the amount to redeem equal to the order balance.
            amountToRedeem = orderBalance;
        }

        // Creates a payment instrument from this gift certificate.
        return this.object.createGiftCertificatePaymentInstrument(giftCertificate.getGiftCertificateCode(), amountToRedeem);
    },

    /**
     * Creates a new QuantityLineItem helper object for each quantity of a ProductLineItem, if one does not already exist.
     * It does not create QuantityLineItems for products using in-store pickup as the shipping method.
     *
     * @alias module:models/CartModel~CartModel/separateQuantities
     * @param {dw.order.ProductLineItem} pli - The ProductLineItem.
     * @param {dw.util.ArrayList} quantityLineItems - The existing QuantityLineItems.
     * @returns {dw.util.ArrayList} A list of separated QuantityLineItems.
     */
    separateQuantities: function (pli, quantityLineItems) {

        var quantity = pli.quantityValue;

        // Creates new ArrayList if there are no QLIs
        if (!quantityLineItems) {
            quantityLineItems = new ArrayList();
        }

        // Creates for each quantity of the ProductLineItem a new QuantityLineItem.
        for (var i = 0; i < quantity; i++) {
            //Skips plis that are using the in-store pick up shipping method.
            if (empty(pli.custom.fromStoreId)) {
                quantityLineItems.add(new QuantityLineItem(pli));
            }
        }

        return quantityLineItems;
    },

    /**
     * Loads customer addresses and shipment addresses and stores them into the session address book attribute of the cart,
     * if they are available and configured in Business Manager.
     * @alias module:models/CartModel~CartModel/initAddressBook
     * @transactional
     *
     * @param {dw.customer.Customer} customer - The customer to load the addresses from.
     */
    initAddressBook: function (customer) {

        var shipments = this.getShipments();

        // Loads addresses from the customer address book.
        if (customer.registered && customer.addressBook) {
            for (var i = 0; i < customer.addressBook.addresses.length; i++) {
                this.addAddressToAddressBook(customer.addressBook.addresses[i]);
            }
        }

        // Loads addresses from Shipments excluding in-store shipments.
        if (shipments) {
            for (var k = 0; k < shipments.length; k++) {
                var shipment = shipments[k];
                if (shipment.shippingAddress && shipment.custom.shipmentType !== 'instore') {
                    this.addAddressToAddressBook(shipment.getShippingAddress());
                }
            }
        }
    },

    /**
     * Returns all addresses of the cart's address book. The addresses are stored as a JSON objects in a custom
     * attribute named 'sessionAddressBook'.
     *
     * @alias module:models/CartModel~CartModel/getAddressBookAddresses
     * @returns {dw.util.ArrayList} An ArrayList containing a addresses of the addresses stored in the carts address
     * book.
     */
    getAddressBookAddresses: function () {
        var addressBook = {};
        var addresses = new ArrayList();

        if (!empty(this.object.describe().getCustomAttributeDefinition('sessionAddressBook'))) {

            // Checks session addresses availability.
            if (this.object.custom.sessionAddressBook) {
                try {
                    addressBook = JSON.parse(this.object.custom.sessionAddressBook);
                    addresses.add(addressBook.addresses);
                } catch (error) {
                    MultiShippingLogger.error(Resource.msgf('multishipping.error.parsejson', 'checkout', null, error));
                    return null;
                }
            }

            return addresses;
        }

        return null;
    },

    /**
     * Adds the given address to the address book of the cart.
     *
     * @alias module:models/CartModel~CartModel/addAddressToAddressBook
     * @transactional
     * @param {module:models/TransientAddressModel~TransientAddressModel} addressToAdd - The address to add.
     */
    addAddressToAddressBook: function (addressToAdd) {
        var address = new TransientAddress();
        var addressBook = {};

        if (addressToAdd) {

            // Tries to parse incoming JSON string.
            if (this.object.custom.sessionAddressBook) {
                try {
                    addressBook = JSON.parse(this.object.custom.sessionAddressBook);
                } catch (error) {
                    MultiShippingLogger.error(Resource.msgf('multishipping.error.parsejson', 'checkout', null, error));
                    return;
                }
            }

            // Checks if JSON object already has addresses.
            if (!(addressBook.addresses instanceof Array)) {
                addressBook.addresses = [];
            }

            // Copies referenceAddress to address object to be stringified.
            address.copyFrom(addressToAdd);
            address.UUID = addressToAdd.UUID;
            // Adds address if not already existing.
            if (!address.addressExists(addressBook.addresses)) {
                addressBook.addresses.push(address);
            }
        }

        this.object.custom.sessionAddressBook = JSON.stringify(addressBook);
    },

    /**
     * Updates the given address in the cart's address book.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/updateAddressBookAddress
     * @param {module:models/TransientAddressModel~TransientAddressModel} addressToUpdate - The address to update.
     */
    updateAddressBookAddress: function (addressToUpdate) {
        var addresses = [];
        var addressBook = {};

        if (addressToUpdate && this.object.custom.sessionAddressBook) {
            try {
                addressBook = JSON.parse(this.object.custom.sessionAddressBook);
            } catch (error) {
                MultiShippingLogger.error(Resource.msgf('multishipping.error.parsejson', 'checkout', null, error));
                return;
            }

            addresses = addressBook.addresses;

            for (var i = 0; i < addresses.length; i++) {
                if (addresses[i].UUID === addressToUpdate.UUID) {
                    addressToUpdate.ID = addresses[i].ID;
                    addressToUpdate.referenceAddressUUID = addresses[i].referenceAddressUUID;
                    addressBook.addresses[i] = addressToUpdate;
                }
            }

            this.object.custom.sessionAddressBook = JSON.stringify(addressBook);
        }
    },

    /**
     * Creates an Order based on the cart. If the order is created successfully, it has status CREATED.
     * Once the order is created, the cart is removed from the session and marked for removal.
     *
     * If the order is not created successfully the function returns null, if any of the following conditions are encountered:
     * <ul>
     * <li>any of the totals (net, gross, tax) of the basket is N/A</li>
     * <li>any of the product items is not available</li>
     * <li>any campaign-based coupon in the basket is invalid (see dw.order.CouponLineItem.isValid())</li>
     * <li>the basket represents an order being edited, but the order has been already been replaced by another order</li>
     * <li>the basket represents an order being edited, but the customer associated with the original order is not the same as the current customer</li>
     * </ul>
     * All empty shipments of the basket are removed before creating the order. A shipment is empty if it contains
     * no product or gift certificate line items or all total prices (net, gross, tax) are 0.0.
     *
     * The function decrements inventory for all products contained in the order. This means the 'reserve inventory for
     * order' functionality must not be subsequently called. The function redeems all coupons contained in the order.
     *
     * If the cart contains product or gift certificate line items associated with product list items, the function
     * updates the purchase of the product list items. For example, if the basket contains an item added from a gift
     * registry, the purchase history of the respective gift registry item is updated.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/createOrder
     * @returns {dw.order.Order} The created order in status CREATED or null if an error occured.
     */
    createOrder: function () {
        var basket = this.object;
        var order;
        try {
            order = Transaction.wrap(function () {
                return OrderMgr.createOrder(basket);
            });
        } catch (error) {
            return;
        }

        return order;
    },

    /**
     * Determines if the cart already contains payment instruments of the given payment method and removes them
     * from the basket.
     *
     * @transactional
     * @alias module:models/CartModel~CartModel/removeExistingPaymentInstruments
     * @param {String} method - Name of the payment method.
     */
    removeExistingPaymentInstruments: function (method) {
        var iter = this.getPaymentInstruments(method).iterator();

        // Remove payment instruments.
        while (iter.hasNext()) {
            this.removePaymentInstrument(iter.next());
        }
    },

    /**
     * Gets a gift certificate line item.
     *
     * @alias module:models/CartModel~CartModel/removeExistingPaymentInstruments
     * @param {String} uuid - UUID of the gift certificate line item to retrieve.
     * @return {dw.order.GiftCertificate | null} giftCertificate object with the passed UUID or null if no gift certificate with the passed UUID exists in the cart.
     */
    getGiftCertificateLineItemByUUID: function (uuid) {
        for (var it = this.object.getGiftCertificateLineItems().iterator(); it.hasNext();) {
            var item = it.next();
            if (item.getUUID() === uuid) {
                return item;
            }
        }
        return null;
    }

});

/**
 * Gets a new instance for the current or a given basket.
 *
 * @alias module:models/CartModel~CartModel/get
 * @param parameter {dw.order.Basket=} The basket object to enhance/wrap. If NULL the basket is retrieved from
 * the current session, if existing.
 * @returns {module:models/CartModel~CartModel}
 */
CartModel.get = function (parameter) {
    var basket = null;

    if (!parameter) {

        var currentBasket = BasketMgr.getCurrentBasket();

        if (currentBasket !== null) {
            basket = currentBasket;
        }

    } else if (typeof parameter === 'object') {
        basket = parameter;
    }
    return (basket !== null) ? new CartModel(basket) : null;
};

/**
 * Gets or creates a new instance of a basket.
 *
 * @alias module:models/CartModel~CartModel/goc
 * @returns {module:models/CartModel~CartModel}
 */
CartModel.goc = function () {
    var obj = null;

    var basket = BasketMgr.getCurrentOrNewBasket();

    if (basket && basket !== null) {
        obj = basket;
    }

    return new CartModel(obj);
};

/** The cart class */
module.exports = CartModel;
