'use strict';
/**
 * Model for product variation functionality.
 * @module models/ProductVariationModel
 */

/* API Includes */
var AbstractModel = require('./AbstractModel');

/**
 * ProductVariationModel helper class providing enhanced profile functionality
 * @class module:models/ProductVariationModel~ProductVariationModel
 */
var ProductVariationModel = AbstractModel.extend({
    /** @lends module:models/ProductVariationModel~ProductVariationModel.prototype */
    /**
     * Gets a new instance for a given product variation model.
     * @alias module:models/ProductVariationModel~ProductVariationModel/init
     * @param parameter method of of super class to call.
     */
    init: function (parameter) {
        var instance = this._super(parameter);
        this.initProperties();
        return instance;
    },

    /**
     * Returns the ProductVariationAttrbuteValue object for the given attribute and the value ID.
     *
     * @alias module:models/ProductVariationModel~ProductVariationModel/getVariationAttributeValue
     * @param {dw.catalog.ProductVariationAttrbute} variationAttribute - the attribute
     * @param {String} variationAttributeValueID - the variation attribute value ID
     */
    getVariationAttributeValue: function (variationAttribute, variationAttributeValueID) {
        if (variationAttributeValueID) {
            var allValues = this.object.getAllValues(variationAttribute);
            for (var i = 0; i < allValues.length; i++) {
                if (allValues[i].ID === variationAttributeValueID) {
                    return allValues[i];
                }
            }
        }
        return null;
    }
});

/** The model class */
module.exports = ProductVariationModel;
