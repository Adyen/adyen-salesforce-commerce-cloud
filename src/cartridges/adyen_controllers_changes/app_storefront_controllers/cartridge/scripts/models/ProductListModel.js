'use strict';
/**
 * Model for product list functionality, such as wishlists.
 * @module models/ProductListModel
 */

var AbstractModel = require('./AbstractModel');
var CustomerMgr = require('dw/customer/CustomerMgr');
var ProductListMgr = require('dw/customer/ProductListMgr');
var Transaction = require('dw/system/Transaction');

var app = require('~/cartridge/scripts/app');

/**
 * ProductList helper function providing enhanced functionality for wishlists and other product lists.
 * @class module:models/ProductListModel~ProductListModel
 */
var ProductListModel = AbstractModel.extend(
    /** @lends module:models/ProductListModel~ProductListModel.prototype */
    {
        /**
         * Deletes this Product List
         */
        remove: function () {
            var productList = this.object;
            Transaction.wrap(function () {
                if (productList.getOwner() === customer) {
                    ProductListMgr.removeProductList(productList);
                    delete this;
                } else {
                    throw 'Error: Only the owner of a Gift Registry can delete it.';
                }
            });
        },

        /**
         * Removes the given item from the product list.
         *
         * @transactional
         * @alias module:models/ProductListModel~ProductListModel/remove
         * @param  {dw.customer.ProductListItem} item the item to remove
         */
        removeItem: function (item) {
            var list = this.object;
            Transaction.wrap(function () {
                list.removeItem(item);
            });
        },

        /**
         * Adds a product to the product list. In case product is already in list null will be returned
         *
         * @transactional
         * @alias module:models/ProductListModel~ProductListModel/addProduct
         * @param {dw.catalog.Product} product - The product to add
         * @param {Number} quantity - The quantity to add
         * @param {dw.catalog.ProductOptionModel} optionModel The option model for the given product
         * @returns {dw.customer.ProductListItem|null} Added item or null
         */
        addProduct: function (product, quantity, optionModel) {
            if (this.isProductInProductList(product)){
                return null;
            }

            var list = this.object;
            Transaction.wrap(function () {
                var item = list.createProductItem(product);
                if (quantity && !isNaN(quantity)) {
                    item.setQuantityValue(quantity);
                }
                if (optionModel) {
                    item.setProductOptionModel(optionModel);
                }
                // Inherit the public flag from the wishlist.
                item.setPublic(true);

                return item;
            });
        },

        /**
         * Updates an item in the Gift Registry
         *
         * @param {dw.web.FormList} formListItems
         */
        updateItem: function (formListItems) {
            Transaction.wrap(function () {
                var productListItemForm;

                for (var i = 0; i < formListItems.getChildCount(); i++) {
                    productListItemForm = formListItems[i];
                    productListItemForm.copyTo(productListItemForm.object);
                }
            });
        },

        /**
         * Check is product already in the wishlist.
         *
         * @param {dw.catalog.Product} product - The product to check
         */
        isProductInProductList: function(product){
            var productItems = this.getProductItems().iterator();

            while (productItems.hasNext()) {
                let productItem = productItems.next();
                if (product.ID === productItem.productID) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Sets the list to public or private.
         *
         * @transactional
         * @alias module:models/ProductListModel~ProductListModel/setPublic
         * @param {Boolean} isPublic is the value the public flag is set to.
         */
        setPublic: function (isPublic) {
            var productList = this.object;
            Transaction.wrap(function () {
                productList.setPublic(isPublic);
            });
        }
    });

/**
 * Gets the wishlist for the current customer or creates a new wishlist
 * on the fly unless an instance of a product list is passed to it.
 *
 * @transactional
 * @alias module:models/ProductListModel~ProductListModel/
 * returns {module:models/ProductListModel~ProductListModel} New ProductListModel instance.
 */
ProductListModel.get = function (parameter) {
    var obj = null;
    if (typeof parameter === 'undefined') {
        obj = ProductListMgr.getProductLists(customer, dw.customer.ProductList.TYPE_WISH_LIST);
        if (obj.empty) {
            Transaction.wrap(function () {
                obj = ProductListMgr.createProductList(customer, dw.customer.ProductList.TYPE_WISH_LIST);
            });
        } else {
            obj = obj[0];
        }
    } else if (typeof parameter === 'string') {
        obj = ProductListMgr.getProductList(parameter);
    } else if (typeof parameter === 'object') {
        obj = parameter;
    }
    return new ProductListModel(obj);
};

/**
 * Searches for a Product List
 *
 * @param {dw.web.FormGroup} simpleForm - ProductList simple form
 * @param {Number} listType - dw.customer.ProductList.TYPE_* constant
 * @returns {dw.util.Collection.<dw.customer.ProductList>}
 */
ProductListModel.search = function (searchForm, listType) {
    var ProductList = require('dw/customer/ProductList');

    if (listType === ProductList.TYPE_WISH_LIST) {
        return searchWishLists(searchForm, listType);
    } else if (listType === ProductList.TYPE_GIFT_REGISTRY) {
        return searchGiftRegistries(searchForm, listType)
    }

};

/**
 * Attempts to replace a product in the gift registry.
 * @return {Object} JSON object indicating the error state if any pipelets called throw a PIPELET_ERROR.
 */
ProductListModel.replaceProductListItem = function() {
    var currentHttpParameterMap = request.httpParameterMap;
    var newProductListItem;
    var ProductModel = app.getModel('Product');
    var product;
    var productList = ProductListMgr.getProductList(currentHttpParameterMap.productlistid.stringValue);

    if (!productList) {
        return {
            error: true
        };
    }

    var productListItemToReplace = productList.getItem(currentHttpParameterMap.uuid.stringValue);
    if (!productListItemToReplace) {
        return {
            error: true
        };
    }

    Transaction.wrap(function () {
        productList.removeItem(productListItemToReplace);
    });

    if (currentHttpParameterMap.pid.stringValue) {
        product = ProductModel.get(currentHttpParameterMap.pid.stringValue);
    } else {
        throw 'Product ID required but not provided.';
    }

    var quantity = parseInt(currentHttpParameterMap.Quantity.stringValue);

    Transaction.wrap(function () {
        newProductListItem = productList.createProductItem(product.object);
        newProductListItem.setQuantityValue(quantity);

    });
};

function searchWishLists (searchForm, listType) {
    var email = searchForm.email.value;
    var firstName = searchForm.firstname.value;
    var lastName = searchForm.lastname.value;
    var listOwner;

    if (email) {
        listOwner = CustomerMgr.getCustomerByLogin(email);
    } else if (firstName && lastName) {
        var profile = CustomerMgr.queryProfile('firstName = {0} AND lastName = {1}', firstName, lastName);
        if (profile) {
            listOwner = profile.getCustomer();
        }
    }
    if (!listOwner) {
        return;
    }
    return filterOutPrivateLists(ProductListMgr.getProductLists(listOwner, listType));
}

function searchGiftRegistries (searchForm, listType) {
    var registrantFirstName = searchForm.registrantFirstName.value;
    var registrantLastName = searchForm.registrantLastName.value;
    var eventType = searchForm.eventType.value;
    var listOwner;
    var listProfile = CustomerMgr.queryProfile('firstName = {0} AND lastName = {1}', registrantFirstName, registrantLastName);
    if (listProfile) {
        listOwner = listProfile.getCustomer();
    } else {
        return null;
    }

    if (eventType) {
        return filterOutPrivateLists(ProductListMgr.getProductLists(listOwner, listType, eventType));
    } else {
        return filterOutPrivateLists(ProductListMgr.getProductLists(listOwner, listType));
    }
}


/**
 * Takes a list of ProductLists and returns a list of the public ones
 *
 * @param {dw.util.Collection} listCollection - a list of ProductLists
 * @returns {dw.util.Collection} publicList - a list of ProductLists that are public
 */
function filterOutPrivateLists (listCollection) {
    var ArrayList = require('dw/util/ArrayList');
    var listIterator = listCollection.iterator();
    var publicList = new ArrayList();

    while (listIterator.hasNext()) {
        var list = listIterator.next();
        if (list.public) {
            publicList.add(list);
        }
    }
    return publicList;
}

/** The ProductList class */
module.exports = ProductListModel;
