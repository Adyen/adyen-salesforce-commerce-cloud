'use strict';

/**
 * Controller for creating, modifying, and showing a product comparison.
 * @module controllers/Compare
 */

/* API Includes */
var HashMap = require('dw/util/HashMap');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Product = app.getModel('Product');
var Category = app.getModel('Category');
var Compare = app.getModel('Compare');

/**
 * Gets a compare form and gets or creates a comparison object associated with the session.
 * Renders the product/compare/compareshow template.
 */
function show() {
    var compareForm = app.getForm('compare');

    // Get the product comparison object from the session or create a new one.
    var comparison = Compare.get();
    comparison.setCategory(request.httpParameterMap.category.value);

    // Store selected compare list properties in a map.
    var map = new HashMap();
    map.put('categories', comparison.getCategories());
    map.put('products', comparison.getProducts());
    map.put('attributegroups', comparison.getAttributeGroups());
    map.put('category', comparison.getCategory());

    compareForm.copyFrom(map);
    compareForm.object.categories.setOptions(map.categories);

    app.getView({CompareList: map}).render('product/compare/compareshow');
}

/**
 * Adds a product to a comparison. Gets the product and category from the httpParameterMap pid and category.
 * If there is no product or category, the function renders a JSON message indicating failure. If both are available,
 * gets the comparison object and adds the product. If successful, renders a JSON message indicating success.
 * @return {object} JSON object indicating success or failure.
 */
function addProduct() {
    let r = require('~/cartridge/scripts/util/Response');

    var product = Product.get(request.httpParameterMap.pid.value);
    if (!product) {
        r.renderJSON({
            success: false
        });
        return;
    }

    var category = Category.get(request.httpParameterMap.category.value);
    if (!category) {
        r.renderJSON({
            success: false
        });
        return;
    }

    // Get the product comparison object from the session or create a new one.
    var comparison = Compare.get();
    comparison.add(product.object, category.object);
    comparison.setCategory(category.getID());

    r.renderJSON({
        success: true
    });
}

/**
 * Removes a product from a comparison. Gets the product and category from the httpParameterMap pid and category.
 * If there is no product or category, the function renders a JSON message indicating failure.
 * If both are available, gets the comparison object and removes the product. If successful, renders a JSON message indicating success.
 * @return {object} JSON object indicating success or failure.
 */
function removeProduct() {
    let r = require('~/cartridge/scripts/util/Response');

    var product = Product.get(request.httpParameterMap.pid.value);
    if (!product) {
        r.renderJSON({
            success: false
        });
        return;
    }

    var category = Category.get(request.httpParameterMap.category.value);
    if (!category) {
        r.renderJSON({
            success: false
        });
        return;
    }

    // Get the product comparison object from the session or create a new one.
    var comparison = Compare.get();
    comparison.remove(product.object, category.object);
    comparison.setCategory(category.getID());

    r.renderJSON({
        success: true
    });
}

/**
 * Renders the controls for the comparison, including the product images, Compare Items button, and Clear All button.
 * Gets the category from the httpParameterMap category value. If there is no category, renders the search/components/productcomparewidget template.
 * Gets the comparison object and renders the search/components/productcomparewidget template.
 */
function controls() {

    var category = Category.get(request.httpParameterMap.category.value);
    if (!category) {
        app.getView().render('search/components/productcomparewidget');
        return;
    }

    // Get the product comparison object from the session or create a new one.
    var comparison = Compare.get();
    
    // Set the category
    comparison.setCategory(category.getID());
    
    var comparisonData = {
        attributegroups: comparison.getAttributeGroups(),
        categories: comparison.getCategories(),
        category: comparison.getCategory(),
        products: comparison.getProducts()
    };
    
    app.getView({CompareList: comparisonData, Category: category.object}).render('search/components/productcomparewidget');
}

/*
 * Web exposed methods
 */
/** Creates a product comparison.
 * @see module:controllers/Compare~show */
exports.Show = guard.all(show);
/** Adds a product to a comparison.
 * @see module:controllers/Compare~addProduct */
exports.AddProduct = guard.ensure(['get'], addProduct);
/** @see module:controllers/Compare~removeProduct */
exports.RemoveProduct = guard.ensure(['get'], removeProduct);
/** Renders the product comparison widget.
 * @see module:controllers/Compare~controls */
exports.Controls = guard.ensure(['get'], controls);
