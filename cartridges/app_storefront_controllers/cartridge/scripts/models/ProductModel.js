'use strict';

/**
 * Model for product functionality.
 * @module models/ProductModel
 */

var AbstractModel = require('./AbstractModel');
var app = require('~/cartridge/scripts/app');
var ProductMgr = require('dw/catalog/ProductMgr');

/**
 * Product helper providing enhanced product functionality
 * @class module:models/ProductModel~ProductModel
 * @extends module:models/AbstractModel
 *
 * @param {dw.catalog.Product} obj - The product object to enhance and wrap.
 */
var ProductModel = AbstractModel.extend(
    /** @lends module:models/ProductModel~ProductModel.prototype */
    {
         /**
         * Processes variation value selections and calculates and returns the ProductVariationModels
         * for one or multiple products. The function uses the given HttpParameterMap, so the request parameters do not
         * need to be passed in. Variation value selections must be specified as HTTP parameters in the following form:
         * <pre>{prefix_}{pid}_varAttrID={varAttrValueID}</pre>
         *
         * A custom prefix can be set using the <code>optionalCustomPrefix</code> parameter.
         * Otherwise, the default prefix <code>dwvar_</code> is used. {pid}is the product id.
         *
         * Example: <pre>dwvar_PN00050_color=red</pre>
         *
         * The function processes variation attributes in their defined order and ignores attributes or values not
         * defined for a variation. The function returns a map of ProductVariationModels with the product instance as
         * the key and the ProductVariationModel as the value. The product may either be a master or a variant.
         *
         * @alias module:models/ProductModel~ProductModel/updateVariationSelection
         * @param parameterMap {dw.web.HttpParameterMap} Variation value selections as HTTP parameters.
         * @param optionalCustomPrefix {String} Optional prefix for HTTP parameters. If nothing is passed, the default prefix "dwvar_" is assumed.
         *
         * @returns {dw.catalog.ProductVariationModel}
         */
        updateVariationSelection: function (parameterMap, optionalCustomPrefix) {
            let formPrefix = optionalCustomPrefix || 'dwvar_';

            // Gets all variation-related parameters for the prefix.
            let params = parameterMap.getParameterMap(formPrefix + this.object.ID.replace(/_/g,'__') + '_');
            let paramNames = params.getParameterNames();

            // Return the ProductVariationModel of a sole variant of a Product Master
            let variants = this.getVariants();
            if (variants.length === 1) {
                return variants[0].getVariationModel();
            }

            if (this.isProductSet() || this.isBundle()) {
                return;
            }

            if (!paramNames.getLength() && this.getVariationModel()) {
                return this.getVariationModel();
            }

            let ProductVariationModel = app.getModel('ProductVariation');
            let variationModel = new ProductVariationModel(this.getVariationModel());

            for (let k = 0; k < paramNames.length; k++) {
                let attributeID = paramNames[k];
                let valueID = params.get(attributeID).getStringValue();
                let variationAttribute = variationModel.getProductVariationAttribute(attributeID);
                let variationAttributeValue;

                if (variationAttribute && valueID) {
                    variationAttributeValue = variationModel.getVariationAttributeValue(variationAttribute, valueID);
                }

                if (variationAttribute && variationAttributeValue) {
                    // When selecting an attribute value, we must prevent the selection of an attribute value for which
                    // a Product Variation Group does not include
                    if (!this.isVariationGroup() || isAttrSelectable(this, variationAttribute, variationAttributeValue)) {
                        variationModel.setSelectedAttributeValue(variationAttribute.ID, variationAttributeValue.ID);
                    }
                }
            }

            return variationModel.object;
        },
        /**
         * Processes option value selections and calculates and returns the ProductOptionModels
         * for one or multiple products.
         * Option value selections must be specified as HTTP parameters in the following form:
         * <pre>{prefix_}{pid}_optionID={optionValueID}</pre>
         *
         * A custom prefix is set using the 'optionalCustomPrefix" parameter. Otherwise,
         * the default prefix <code>dwopt_</code> is used. {pid} is the product id.
         *
         * Example: <pre>dwopt_PN00049_memory=2GB</pre>
         *
         * For each product
         * specified as {pid}, a ProductOptionModel instance is created and returned as an element of the 'ProductOptionModels'
         * HashMap output parameter. The function validates both option id and option value id and selects the option in the
         * related ProductOptionModel instance.
         *
         * If an option is not specified as an HTTP parameter, or the specified optionValueID
         * is invalid, the default option value of this option is selected. Invalid optionIDs are silently ignored. The
         * function returns a map of ProductOptionModels with the product instance as the key and the ProductOptionModel as
         * the value. For compatibility reasons, the function does still accept an individual product instance as input
         * parameter. If specified, the function returns the ProductOptionModel for this product as 'ProductOptionModel' and
         * also as element of the 'ProductOptionModels' hashmap parameter.
         *
         * @alias module:models/ProductModel~ProductModel/updateOptionSelection
         * @param product {dw.catalog.Product} An optional product instance for which the ProductOptionModel is updated.
         * @param parameterMap {dw.web.HttpParameterMap} Product option selections as HTTP parameters.
         * @param optionalCustomPrefix {String} Optional prefix for HTTP parameters. If nothing is passed, the default prefix "dwopt_" is assumed.
         *
         * @returns {dw.catalog.ProductOptionModel} The product option model.
         */
        updateOptionSelection: function (parameterMap, optionalCustomPrefix) {
            var formPrefix = optionalCustomPrefix || 'dwopt_';

            // Gets all option related parameters for the prefix.
            var params = parameterMap.getParameterMap(formPrefix + this.object.ID.replace(/_/g,'__') + '_');
            var paramNames = params.getParameterNames();

            var optionModel = this.object.getOptionModel();

            for (var k = 0; k < paramNames.length; k++) {
                var optionID      = paramNames[k];
                var optionValueID = params.get(optionID).getStringValue();

                if (optionValueID) {
                    var option = optionModel.getOption(optionID);

                    if (option && optionValueID) {
                        var optionValue = optionModel.getOptionValue(option, optionValueID);
                        if (optionValue) {
                            optionModel.setSelectedOptionValue(option, optionValue);
                        }
                    }
                }
            }

            return optionModel;
        },

        /**
         * Returns a collection of all online products that are assigned to this product and
         * that are also available through the current site. If this product does not represent a
         * product set then an empty collection is returned.
         *
         * @alias module:models/ProductModel~ProductModel/getOnlineProductSetProducts
         * @return {dw.util.Collection} Collection of online products that are assigned to this product and that are also available through the current site.
         */
        getOnlineProductSetProducts: function () {

            var onlineProductSetProducts = new dw.util.ArrayList();

            if (this.object.isProductSet()) {
                var productSetProducts = this.object.getProductSetProducts();

                var i = null;
                for (i = 0; i < productSetProducts.length; i++) {
                    if (productSetProducts[i].isOnline()) {
                        onlineProductSetProducts.add(productSetProducts[i]);
                    }
                }
            }

            return onlineProductSetProducts;
        },

        /**
         * Returns true if the product is visible in the storefront. The function checks the online flag of the product
         * itself and if the product is a product set, checks the online flag of all products in the product set.
         *
         * @alias module:models/ProductModel~ProductModel/isVisible
         * @returns {boolean} true if the product is visible in the storefront, false otherwise
         */
        isVisible: function () {

            if (!this.object) {
                return false;
            }

            //if the product itself is not online
            if (!this.isOnline()) {
                return false;
            }

            if (!this.isAssignedToSiteCatalog()) {
                return false;
            }

            //if the product is variant and its master if not online
            if (this.object.variant && this.object.masterProduct && !this.object.masterProduct.online) {
                return false;
            }

            if (this.isProductSet() && this.getOnlineProductSetProducts().isEmpty()) {
                return false;
            }

            return true;
        },

        /**
         * Returns a JSON object holding availability information for the current product and the given
         * quantity.
         *
         * @alias module:models/ProductModel~ProductModel/getAvailability
         * @param quantity {String} the quantity. Usually, this is the amount the customer has selected to purchase.
         * @returns {{status: *, statusQuantity: number, inStock: *, ats: number, inStockDate: string, availableForSale: boolean, levels: {}}}
         */
        getAvailability: function (quantity) {
            var qty = isNaN(quantity) ? 1 : parseInt(quantity).toFixed();

            /* product availability */
            var avm = this.getAvailabilityModel();

            var availability = {
                status: avm.getAvailabilityStatus(),
                statusQuantity: qty,
                inStock: avm.inStock,
                ats: !avm.inventoryRecord ? 0 : avm.inventoryRecord.ATS.value.toFixed(),
                inStockDate: !avm.inventoryRecord || !avm.inventoryRecord.inStockDate ? '' : avm.inventoryRecord.inStockDate.toDateString(),
                availableForSale: avm.availability > 0,
                levels: {}
            };

            var avmLevels = dw.catalog.ProductAvailabilityLevels = avm.getAvailabilityLevels((qty < 1) ? 1 : qty);
            availability.isAvailable = avmLevels.notAvailable.value === 0;
            availability.inStockMsg = dw.web.Resource.msgf('global.quantityinstock', 'locale', '', avmLevels.inStock.value.toFixed());
            availability.preOrderMsg = dw.web.Resource.msgf('global.quantitypreorder', 'locale', '', avmLevels.preorder.value.toFixed());
            availability.backOrderMsg = dw.web.Resource.msgf('global.quantitybackorder', 'locale', '', avmLevels.backorder.value.toFixed());
            if (avm && avm.inventoryRecord && avm.inventoryRecord.inStockDate) {
                availability.inStockDateMsg = dw.web.Resource.msgf('global.inStockDate', 'locale', '', avm.inventoryRecord.inStockDate.toDateString());
            }

            availability.levels[dw.catalog.ProductAvailabilityModel.AVAILABILITY_STATUS_IN_STOCK] = avmLevels.inStock.value;
            availability.levels[dw.catalog.ProductAvailabilityModel.AVAILABILITY_STATUS_PREORDER] = avmLevels.preorder.value;
            availability.levels[dw.catalog.ProductAvailabilityModel.AVAILABILITY_STATUS_BACKORDER] = avmLevels.backorder.value;
            availability.levels[dw.catalog.ProductAvailabilityModel.AVAILABILITY_STATUS_NOT_AVAILABLE] = avmLevels.notAvailable.value;

            return availability;
        }

    });

/**
 * Gets a new instance of a given product or product ID.
 *
 * @alias module:models/ProductModel~ProductModel/get
 * @param parameter {(dw.catalog.Product|String)} The product object to enhance/wrap or the product ID of the product object.
 * @returns {module:models/ProductModel~ProductModel}
 */
ProductModel.get = function (parameter) {
    var obj = null;
    if (typeof parameter === 'string') {
        obj = ProductMgr.getProduct(parameter);
    } else if (typeof parameter === 'object') {
        obj = parameter;
    }
    return new ProductModel(obj);
};

/**
 * Determines whether an attribute is selectable for a given Variation Group
 *
 * @param {dw.catalog.VariationGroup} variationGroup
 * @param {dw.catalog.ProductVariationAttribute} attr
 * @param {dw.catalog.ProductVariationAttributeValue} value
 * @returns {Boolean}
 */
function isAttrSelectable (variationGroup, attr, attrValue) {
    let variationModel = variationGroup.getVariationModel();
    let selectedVariantsIter = variationModel.getSelectedVariants().iterator();

    while (selectedVariantsIter.hasNext()) {
        let variant = selectedVariantsIter.next();
        let variantAttrValue;

        variationModel = variant.getVariationModel();
        variantAttrValue = variationModel.getVariationValue(variant, attr);

        if (variantAttrValue.value == attrValue.value) {
            return true;
        }
    }

    return false;
}

/** The product class */
module.exports = ProductModel;
