'use strict';

/**
 * Controller that forwards calls to other controllers. It supports legacy code where
 * content assets linked to this controller only. For all new code, link to the respective
 * controller directly (Search-Show, Product-Show, etc.)
 *
 * @module controllers/Link
 */

/* Script Modules */
var app = require('~/cartridge/scripts/app');

/**
 * Required for $link-category()$ HTML attribute directive.
 *
 * @deprecated Use $url('Search-Show','cgid','...') instead
 */
exports.Category = app.getController('Search').Show;

/**
 * Required for $link-categoryproduct()$ HTML attribute directive.
 *
 * @deprecated Use $url('Product-Show','pid','...','cgid','...') instead
 */
exports.CategoryProduct = app.getController('Product').Show;

/**
 * Required for $link-product()$ HTML attribute directive.
 *
 * @deprecated Use $url('Product-Show','pid','...') instead
 */
exports.Product = app.getController('Product').Show;

/**
 * Required for $link-page()$ HTML attribute directive.
 *
 * @deprecated Use $url('Page-Show','cid','...') instead
 */
exports.Page = app.getController('Page').Show;
