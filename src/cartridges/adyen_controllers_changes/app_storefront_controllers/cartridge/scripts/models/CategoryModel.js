'use strict';

/**
 * Model for category functionality.
 * @module models/CategoryModel
 */

/* API Includes */
var AbstractModel = require('./AbstractModel');
var ArrayList = require('dw/util/ArrayList');
var CatalogMgr = require('dw/catalog/CatalogMgr');

/**
 * Category helper providing enhanced category functionality.

 * @class module:models/CategoryModel~CategoryModel
 * @extends module:models/AbstractModel
 * @param {dw.catalog.Category} obj The category object to wrap.
 */
var CategoryModel = AbstractModel.extend(
    /** @lends module:models/CategoryModel~CategoryModel.prototype */
    {
        /**
         * Prints out the category's alternative URL if maintained in a custom attribute.
         * Uses custom attribute of type MarkupText to be able to maintain URLUtil-styled URLs, such as <code>$url('GiftCert-Purchase')$<code>
         * @alias module:models/CategoryModel~CategoryModel/getUrl
         * @return {dw.web.URL} URL for the Search controller Show function with the category ID.
         */
        getUrl: function () {
            var category = this.object;
            var url = dw.web.URLUtils.http('Search-Show', 'cgid', category.getID());

            return url;
        },

        /**
         * Gets a list of online categories that have the showInMenu attribute set to true.
         * The showInMenu attribute is a custom attribute for SiteGenesis that determines whether a
         * category is shown in the site navigation.
         *
         * @param {Boolean} renderAllCategories Returns all online subcategories if true.
         * @alias module:models/CategoryModel~CategoryModel/getMenuCategories
         * @return {Array} Subcategories for menu.
         */
        getMenuCategories: function (renderAllCategories) {
            var subcategories = this.object.getOnlineSubCategories(),
                result        = [];
            if (renderAllCategories) {
                return subcategories;
            }
            if (subcategories) {
                for (var i = 0; i < subcategories.length; i++) {
                    if (('showInMenu' in subcategories[i].custom) && subcategories[i].custom.showInMenu.valueOf()) {
                        result.push(subcategories[i]);
                    }
                }
            }
            return result;
        },

        /**
         * Returns top level online categories list if it exists, otherwise returns sibling online categories list if it exists.
         * If neither exist, it returns an empty list.
         * @alias module:models/CategoryModel~CategoryModel/getTopLevelCategories
         * @return {Collection | ArrayList} Returns a collection of online subcategories or an empty list if there are no top level categories.
         */
        getTopLevelCategories: function () {
            if (this.object.getParent() !== null) {
                if (this.object.getParent().getParent() !== null) {
                    return this.object.getParent().getParent().getOnlineSubCategories();
                } else {
                    return this.object.getParent().getOnlineSubCategories();
                }
            } else {
                return new ArrayList();
            }
        }
    });

/**
 * Gets a new instance of a given category.
 *
 * @alias module:models/CategoryModel~CategoryModel/get
 * @param parameter {(dw.catalog.Category|String)} The category object to enhance/wrap or the category ID of the category
 * object.
 * @returns {module:models/CategoryModel~CategoryModel} A new CategoryModel instance.
 */
CategoryModel.get = function (parameter) {
    var obj = null;
    if (typeof parameter === 'string') {
        obj = CatalogMgr.getCategory(parameter);
    } else if (typeof parameter === 'object') {
        obj = parameter;
    }
    return new CategoryModel(obj);
};

/**
 * Returns the root category from the site catalog.
 *
 * @alias module:models/CategoryModel~CategoryModel/getTopLevelCategory
 * @returns {dw.catalog.Category} The root catalog category.
 */
CategoryModel.getTopLevelCategory = function () {
    var siteCatalog = CatalogMgr.getSiteCatalog();
    return (siteCatalog !== null) ? siteCatalog.getRoot() : null;
};

/** The category class */
module.exports = CategoryModel;
