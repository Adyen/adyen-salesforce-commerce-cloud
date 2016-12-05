'use strict';

/**
 * Controller that renders product detail pages and snippets or includes used on product detail pages.
 * Also renders product tiles for product listings.
 *
 * @module controllers/Product
 */

var params = request.httpParameterMap;

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Renders the product page.
 *
 * If the product is online, gets a ProductView and updates the product data from the httpParameterMap.
 * Renders the product page (product/product template). If the product is not online, sets the response status to 401,
 * and renders an error page (error/notfound template).
 */
function show() {

    const Product = app.getModel('Product');
    let product = Product.get(params.pid.stringValue);
    const currentVariationModel = product.updateVariationSelection(params);
    product = product.isVariationGroup() ? product : getSelectedProduct(product);

    if (product.isVisible()) {
        require('~/cartridge/scripts/meta').update(product);
        app.getView('Product', {
            product: product,
            DefaultVariant: product.getVariationModel().getDefaultVariant(),
            CurrentOptionModel: product.updateOptionSelection(params),
            CurrentVariationModel: currentVariationModel
        }).render(product.getTemplate() || 'product/product');
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the Web Adapter won't resolve.
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders the product detail page.
 *
 * If the product is online, gets a ProductView and updates the product data from the httpParameterMap.
 * Renders the product detail page (product/productdetail template). If the product is not online, sets the response status to 401,
 * and renders an error page (error/notfound template).
 */
function detail() {

    const Product = app.getModel('Product');
    const product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {
        app.getView('Product', {
            product: product,
            DefaultVariant: product.getVariationModel().getDefaultVariant(),
            CurrentOptionModel: product.updateOptionSelection(params),
            CurrentVariationModel: product.updateVariationSelection(params)
        }).render(product.getTemplate() || 'product/productdetail');
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Returns product availability data as a JSON object.
 *
 * Gets a ProductModel and gets the product ID from the httpParameterMap. If the product is online,
 * renders product availability data as a JSON object.
 * If the product is not online, sets the response status to 401,and renders an error page (error/notfound template).
 */
function getAvailability() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {
        let r = require('~/cartridge/scripts/util/Response');

        r.renderJSON(product.getAvailability(params.Quantity.stringValue));
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders a product tile. This is used within recommendation and search grid result pages.
 *
 * Gets a ProductModel and gets a product using the product ID in the httpParameterMap.
 * If the product is online, renders a product tile (product/producttile template), used within family and search result pages.
 */
function hitTile() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {
        var productView = app.getView('Product', {
            product: product,
            showswatches: true,
            showpricing: true,
            showpromotion: true,
            showrating: true,
            showcompare: true
        });

        productView.product = product.object;
        productView.render(product.getTemplate() || 'product/producttile');
    }

}

/**
 * Renders a navigation include on product detail pages.
 *
 * Gets a ProductModel and gets a product using the product ID in the httpParameterMap.
 * If the product is online, constructs a search and paging model, executes the search,
 * and renders a navigation include on product detail pages (search/productnav template).
 * Also provides next/back links for customers to traverse a product
 * list, such as a search result list.
 */
function productNavigation() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {
        var PagingModel;
        var productPagingModel;

        // Construct the search based on the HTTP params and set the categoryID.
        var Search = app.getModel('Search');
        var productSearchModel = Search.initializeProductSearchModel(params);

        // Reset pid in search.
        productSearchModel.setProductID(null);

        // Special handling if no category ID is given in URL.
        if (!params.cgid.value) {
            var category = null;

            if (product.getPrimaryCategory()) {
                category = product.getPrimaryCategory();
            } else if (product.getVariationModel().getMaster()) {
                category = product.getVariationModel().getMaster().getPrimaryCategory();
            }

            if (category && category.isOnline()) {
                productSearchModel.setCategoryID(category.getID());
            }
        }

        // Execute the product searchs
        productSearchModel.search();

        // construct the paging model
        PagingModel = require('dw/web/PagingModel');
        productPagingModel = new PagingModel(productSearchModel.productSearchHits, productSearchModel.count);
        productPagingModel.setPageSize(3);
        productPagingModel.setStart(params.start.intValue - 2);

        app.getView({
            ProductPagingModel: productPagingModel,
            ProductSearchResult: productSearchModel
        }).render('search/productnav');

    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders variation selection controls for a given product ID, taken from the httpParameterMap.
 *
 * If the product is online, updates variation information and gets the selected variant. If it is an ajax request, renders the
 * product content page (product/productcontent template), otherwise renders the product page (product/product template).
 * If it is a bonus product, gets information about the bonus discount line item and renders the bonus product include page
 * (pageproduct/components/bonusproduct template). If the product is offline, sets the request status to 401 and renders an
 * error page (error/notfound template).
 */
function variation() {

    const Product = app.getModel('Product');
    const resetAttributes = false;
    let product = Product.get(params.pid.stringValue);

    let currentVariationModel = product.updateVariationSelection(params);
    product = product.isVariationGroup() ? product : getSelectedProduct(product);

    if (product.isVisible()) {
        if (params.source.stringValue === 'bonus') {
            const Cart = app.getModel('Cart');
            const bonusDiscountLineItems = Cart.get().getBonusDiscountLineItems();
            let bonusDiscountLineItem = null;

            for (let i = 0; i < bonusDiscountLineItems.length; i++) {
                if (bonusDiscountLineItems[i].UUID === params.bonusDiscountLineItemUUID.stringValue) {
                    bonusDiscountLineItem = bonusDiscountLineItems[i];
                    break;
                }
            }

            app.getView('Product', {
                product: product,
                CurrentVariationModel: currentVariationModel,
                BonusDiscountLineItem: bonusDiscountLineItem
            }).render('product/components/bonusproduct');
        } else if (params.format.stringValue) {
            app.getView('Product', {
                product: product,
                GetImages: true,
                resetAttributes: resetAttributes,
                CurrentVariationModel: currentVariationModel
            }).render('product/productcontent');
        } else {
            app.getView('Product', {
                product: product,
                CurrentVariationModel: currentVariationModel
            }).render('product/product');
        }
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders variation selection controls for the product set item identified by a given product ID, taken from the httpParameterMap.
 *
 * If the product is online, updates variation information and gets the selected variant. If it is an ajax request, renders the
 * product set page (product/components/productsetproduct template), otherwise renders the product page (product/product template).
 *  If the product is offline, sets the request status to 401 and renders an error page (error/notfound template).
 *
 */
function variationPS() {

    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);

    if (product.isVisible()) {

        var productView = app.getView('Product', {
            product: product
        });

        var productVariationSelections = productView.getProductVariationSelections(params);
        product = Product.get(productVariationSelections.SelectedProduct);

        if (product.isMaster()) {
            product = Product.get(product.getVariationModel().getDefaultVariant());
        }

        if (params.format.stringValue) {
            app.getView('Product', {product: product}).render('product/components/productsetproduct');
        } else {
            app.getView('Product', {product: product}).render('product/product');
        }
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Renders the last visited products based on the session information (product/lastvisited template).
 */
function includeLastVisited() {
    app.getView({
        LastVisitedProducts: app.getModel('RecentlyViewedItems').getRecentlyViewedProducts(3)
    }).render('product/lastvisited');
}

/**
 * Renders a list of bonus products for a bonus discount line item (product/bonusproductgrid template).
 */
function getBonusProducts() {
    var Cart = app.getModel('Cart');
    var getBonusDiscountLineItemDS = require('app_storefront_core/cartridge/scripts/cart/GetBonusDiscountLineItem');
    var currentHttpParameterMap = request.httpParameterMap;
    var bonusDiscountLineItems = Cart.get().getBonusDiscountLineItems();
    var bonusDiscountLineItem;

    bonusDiscountLineItem = getBonusDiscountLineItemDS.getBonusDiscountLineItem(bonusDiscountLineItems, currentHttpParameterMap.bonusDiscountLineItemUUID);
    var bpCount = bonusDiscountLineItem.bonusProducts.length;
    var bpTotal;
    var bonusDiscountProducts;
    if (currentHttpParameterMap.pageSize && !bpCount) {

        var BPLIObj = getBonusDiscountLineItemDS.getBonusPLIs(currentHttpParameterMap.pageSize, currentHttpParameterMap.pageStart, bonusDiscountLineItem);

        bpTotal = BPLIObj.bpTotal;
        bonusDiscountProducts = BPLIObj.bonusDiscountProducts;
    } else {
        bpTotal = -1;
    }

    app.getView({
        BonusDiscountLineItem: bonusDiscountLineItem,
        BPTotal: bpTotal,
        BonusDiscountProducts: bonusDiscountProducts
    }).render('product/bonusproductgrid');

}

/**
 * Renders a set item view for a given product ID, taken from the httpParameterMap pid parameter.
 * If the product is online, get a ProductView and renders the product set page (product/components/productsetproduct template).
*  If the product is offline, sets the request status to 401 and renders an error page (error/notfound template).
*/
function getSetItem() {
    var currentVariationModel;
    var Product = app.getModel('Product');
    var product = Product.get(params.pid.stringValue);
    product = getSelectedProduct(product);
    currentVariationModel = product.updateVariationSelection(params);

    if (product.isVisible()) {
        app.getView('Product', {
            product: product,
            CurrentVariationModel: currentVariationModel,
            isSet: true
        }).render('product/components/productsetproduct');
    } else {
        // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
        // remote includes which the WA won't resolve
        response.setStatus(410);
        app.getView().render('error/notfound');
    }

}

/**
 * Checks whether a given product has all required attributes selected, and returns the selected variant if true
 *
 * @param {dw.catalog.Product} product
 * @returns {dw.catalog.Product} - Either input product or selected product variant if all attributes selected
 */
function getSelectedProduct (product) {
    const currentVariationModel = product.updateVariationSelection(params);
    let selectedVariant;

    if (currentVariationModel) {
        selectedVariant = currentVariationModel.getSelectedVariant();
        if (selectedVariant) {
            product = app.getModel('Product').get(selectedVariant);
        }
    }

    return product;
}

/**
 * Renders the product detail page within the context of a category.
 * Calls the {@link module:controllers/Product~show|show} function.
 * __Important:__ this function is not obsolete and must remain as it is used by hardcoded platform rewrite rules.
 */
function showInCategory() {
    show();
}

/*
 * Web exposed methods
 */
/**
 * Renders the product template.
 * @see module:controllers/Product~show
 */
exports.Show = guard.ensure(['get'], show);

/**
 * Renders the product detail page within the context of a category.
 * @see module:controllers/Product~showInCategory
 */
exports.ShowInCategory = guard.ensure(['get'], showInCategory);

/**
 * Renders the productdetail template.
 * @see module:controllers/Product~detail
 */
exports.Detail = guard.ensure(['get'], detail);

/**
 * Returns product availability data as a JSON object.
 * @see module:controllers/Product~getAvailability
 */
exports.GetAvailability = guard.ensure(['get'], getAvailability);

/**
 * Renders a product tile, used within family and search result pages.
 * @see module:controllers/Product~hitTile
 */
exports.HitTile = guard.ensure(['get'], hitTile);

/**
 * Renders a navigation include on product detail pages.
 * @see module:controllers/Product~productNavigation
 */
exports.Productnav = guard.ensure(['get'], productNavigation);

/**
 * Renders variation selection controls for a given product ID.
 * @see module:controllers/Product~variation
 */
exports.Variation = guard.ensure(['get'], variation);

/**
 * Renders variation selection controls for the product set item identified by the given product ID.
 * @see module:controllers/Product~variationPS
 */
exports.VariationPS = guard.ensure(['get'], variationPS);

/**
 * Renders the last visited products based on the session information.
 * @see module:controllers/Product~includeLastVisited
 */
exports.IncludeLastVisited = guard.ensure(['get'], includeLastVisited);

/**
 * Renders a list of bonus products for a bonus discount line item.
 * @see module:controllers/Product~getBonusProducts
 */
exports.GetBonusProducts = guard.ensure(['get'], getBonusProducts);

/**
 * Renders a set item view for the given product ID.
 * @see module:controllers/Product~getSetItem
 */
exports.GetSetItem = guard.ensure(['get'], getSetItem);
