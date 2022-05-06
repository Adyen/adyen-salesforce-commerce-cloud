'use strict';

/**
 * Model for search functionality.
 *
 * @module models/SearchModel
 */

/* API Includes */
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ContentSearchModel = require('dw/content/ContentSearchModel');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');

/**
 * Search helper class providing enhanced search functionality.
 * @class module:models/SearchModel~SearchModel
 */
var SearchModel = ({

});

/**
 * Initializes the given search model using the HttpParameterMap.
 *
 * @param {dw.catalog.SearchModel} searchModel SearchModel to initialize.
 * @param {dw.web.HttpParameterMap} httpParameterMap HttpParameterMap to read common search parameters from.
 * @returns {dw.catalog.SearchModel} Search model.
 */
SearchModel.initializeSearchModel = function (searchModel, httpParameterMap) {

    if (searchModel) {
        if (httpParameterMap.q.submitted) {
            searchModel.setSearchPhrase(httpParameterMap.q.value);
        }

        if (httpParameterMap.psortb1.submitted && httpParameterMap.psortd1.submitted) {
            searchModel.setSortingCondition(httpParameterMap.psortb1.value, httpParameterMap.psortd1.intValue);
        }

        if (httpParameterMap.psortb2.submitted && httpParameterMap.psortd2.submitted) {
            searchModel.setSortingCondition(httpParameterMap.psortb2.value, httpParameterMap.psortd2.intValue);
        }

        if (httpParameterMap.psortb3.submitted && httpParameterMap.psortd3.submitted) {
            searchModel.setSortingCondition(httpParameterMap.psortb3.value, httpParameterMap.psortd3.intValue);
        }

        var nameMap = httpParameterMap.getParameterMap('prefn');
        var valueMap = httpParameterMap.getParameterMap('prefv');

        for (var i in nameMap) {
            if (valueMap[i]) {
                searchModel.addRefinementValues(nameMap[i], valueMap[i]);
            }
        }

    }
    return searchModel;
};

/**
 * Creates and initializes a {dw.catalog.ProductSearchModel} based on the given HTTP parameters.
 *
 * @param {dw.web.HttpParameterMap} httpParameterMap HttpParameterMap to read product search parameters from.
 * @returns {dw.catalog.ProductSearchModel} Created and initialized product serach model.
 */
SearchModel.initializeProductSearchModel = function (httpParameterMap) {
    var productSearchModel = this.initializeSearchModel(new ProductSearchModel(), httpParameterMap);

    productSearchModel.setRecursiveCategorySearch(true);

    if (httpParameterMap.pid.submitted) {
        productSearchModel.setProductID(httpParameterMap.pid.value);
    }

    if (httpParameterMap.pmin.submitted) {
        productSearchModel.setPriceMin(httpParameterMap.pmin.doubleValue);
    }

    if (httpParameterMap.pmax.submitted) {
        productSearchModel.setPriceMax(httpParameterMap.pmax.doubleValue);
    }
    
    if (httpParameterMap.pmid.submitted) {
        productSearchModel.setPromotionID(httpParameterMap.pmid);
    }

    var sortingRule = httpParameterMap.srule.submitted ? CatalogMgr.getSortingRule(httpParameterMap.srule.value) : null;
    if (sortingRule) {
        productSearchModel.setSortingRule(sortingRule);
    }

    // only add category to search model if the category is online
    if (httpParameterMap.cgid.submitted) {
        var category = CatalogMgr.getCategory(httpParameterMap.cgid.value);
        if (category && category.isOnline() && productSearchModel) {
            productSearchModel.setCategoryID(category.getID());
        }

    }

    return productSearchModel;
};

/**
 * Creates and initializes a {dw.content.ContentSearchModel} based on the given HTTP parameters.
 *
 * @param {dw.web.HttpParameterMap} httpParameterMap HttpParameterMap to read content search parameters from.
 * @returns {dw.content.ContentSearchModel} Created and initialized product serach model.
 */
SearchModel.initializeContentSearchModel = function (httpParameterMap) {
    var contentSearchModel = this.initializeSearchModel(new ContentSearchModel(), httpParameterMap);

    contentSearchModel.setRecursiveFolderSearch(true);
    if (httpParameterMap.cid.submitted) {
        contentSearchModel.setContentID(httpParameterMap.cid.value);
    }

    if (httpParameterMap.fdid.submitted) {
        contentSearchModel.setFolderID(httpParameterMap.fdid.value);
    }
    return contentSearchModel;
};

module.exports = SearchModel;
