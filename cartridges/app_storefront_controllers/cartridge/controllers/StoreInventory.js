'use strict';

/**
 * Controller for in-store functionality that is mostly used on the Product Detail Page.
 * __Note:__core functions are used when the UI cartridge is not in the cartridge path.
 *
 * @module controllers/StoreInventory
 * @TODO Simplify the logic, there is no need to return the stores as JSON to render them in the client
 */

/* Script Modules */
var app     = require('~/cartridge/scripts/app');
var guard   = require('~/cartridge/scripts/guard');

/**
 * Sets the store for a given line item.
 */
function setStore() {
    var parameterMap = request.httpParameterMap;

    var Cart = app.getModel('Cart');
    var cart = Cart.get();

    var result = setStoreInLineItem(cart.object, parameterMap.plid.stringValue, parameterMap.storeid.stringValue,
        parameterMap.storepickup.stringValue);

    let r = require('~/cartridge/scripts/util/Response');

    if (result.ErrorCode) {
        r.renderJSON({
            success: false,
            ErrorCode: result.ErrorCode
        });
        return;
    }

    cart.removeEmptyShipments();

    if (empty(session.custom.storeId) && !empty(parameterMap.storeid.value)) {
        session.custom.storeId = parameterMap.storeid.value;
    }

    r.renderJSON({
        success: true
    });
}

/**
 * Identifies the store selected for in-store pickup and renders selected store
 * (storelocator/storepickup/coreshowselectedstore template). If the
 * httpParameter map does not have a storeId parameter, calls the
 * {@link module:controllers/StoreInventory~showSetStore|showSetStore} function.
 * @TODO - Is this outdated?
 */
function showSelectedStoreCore() {
    session.custom.storeId = request.httpParameterMap.storeId.value;

    if ((session.custom.zipcode !== null) && (session.custom.storeId !== null)) {
        app.getView().render('storelocator/storepickup/coreshowselectedstore');
        return;
    }

    showSetStore();
}

/**
 * Renders the page that displays the set of stores where a product item is in stock
 * (storelocator/storepickup/coresetstore template).
 * If the httpParameter map does not have a storeId parameter, calls the
 * {@link module:controllers/StoreInventory~showZipCode|showZipCode} function.
 */
function showSetStore(stores, storeAvailabilityMap) {
    if (session.custom.zipcode !== null) {

        app.getView({
            Stores: stores,
            storeAvailabilityMap: storeAvailabilityMap
        }).render('storelocator/storepickup/coresetstore');
        return;
    }

    showZipCode();
}

/**
 * Renders the zip codes if the richUI cartridge is not in the path.
 */
function showZipCode() {
    app.getView().render('storelocator/storepickup/corezipcode');
}

/**
 * Creates a HashMap with store information for all stores where a
 * product is available for in-store pickup.
 */
function showAvailableStores() {
    session.custom.zipcode = request.httpParameterMap.zipCode.value;

    var stores = lookupByZipCode().Stores;

    var Product = app.getModel('Product');
    var product = Product.get(request.httpParameterMap.pid.stringValue),
        storeAvailabilityMap;
    if (!product) {
        storeAvailabilityMap = new dw.util.HashMap();
    } else {
        storeAvailabilityMap = getStoreAvailabilityMap(stores, product.object);
    }

    showSetStore(stores, storeAvailabilityMap);
}

/**
 * Calls the {@link module:controllers/StoreInventory~setZipCodeCore|setZipCodeCore} to set the
 * zip code. If the session does not have a custom.zipcode property, calls the
 * {@link module:controllers/StoreInventory~showAvailableStores|showAvailableStores} function.
 */
function cartSetZipCodeCore() {
    if (session.custom.zipcode !== null) {
        showAvailableStores();
    } else {
        setZipCodeCore();
    }
}

/**
 * Calls the {@link module:controllers/StoreInventory~showZipCode|showZipCode} function.
 */
function setZipCodeCore() {
    showZipCode();
}
/**
 * Uses the httpParameter map plid, storeid, and storepickup parameters to
 * set the store and its inventory list for the product line item. If this results in
 * an error, calls the {@link module:controllers/Cart~show|Cart Controller Show function}.
 * If not, then it removes any empty shipments, adds the storeid to the session custom properties
 * and calls the {@link module:controllers/Cart~show|Cart Controller Show function}.
 */
function setStoreCore() {
    var CartController = app.getController('Cart');
    var parameterMap = request.httpParameterMap;

    var Cart = app.getModel('Cart');
    var cart = Cart.get();

    var result = setStoreInLineItem(cart.object, parameterMap.plid.stringValue, parameterMap.storeid.stringValue,
        parameterMap.storepickup.stringValue);

    if (result.ErrorCode) {
        // @FIXME Pass the error to the cart controller
        CartController.Show();
        return;
    }

    cart.removeEmptyShipments();

    if (empty(session.custom.storeId) && !empty(parameterMap.storeid.value)) {
        session.custom.storeId = parameterMap.storeid.value;
    }

    CartController.Show();
}

/**
 * Gets a list of stores with the given product, or product line item's
 * availability to sell (requires rich_UI cartridge). If the storeID is not set it
 * will be set within the session object. Renders a JSON object.
 *
 * Sample URL to call ....Stores-Inventory?pid=2239622&zipCode=01803
 */
function inventory() {
    var storesList = lookupByZipCode().Stores;

    var Product = app.getModel('Product');
    var lineitem = getProductLineItem(request.httpParameterMap.pid.stringValue);

    var product;
    if (!lineitem) {
        product = Product.get(request.httpParameterMap.pid.stringValue).object;
    } else {
        product  = lineitem.product;
    }

    var storeAvailabilityMap = getStoreAvailabilityMap(storesList, product, lineitem);

    // Creates JSON representation.
    var stores = [];

    for (var i = 0, len = storesList.length; i < len; i++) {
        var store = storesList[i];


        // store.custom.inventoryListId : "";
        var inventoryListId = store.custom.inventoryListId || '';
        var inventoryList = dw.catalog.ProductInventoryMgr.getInventoryList(inventoryListId);
        var inventoryRec = inventoryList ? inventoryList.getRecord(Product.ID) : null;

        if (i > 9) {
            break;
        }

        if (storeAvailabilityMap.get(store.ID) === null) {
            continue;
        }

        stores.push({
            storeId: store.ID,
            status: storeAvailabilityMap.get(store.ID),
            statusclass: storeAvailabilityMap.get(store.ID) === dw.web.Resource.msg('cart.store.availableinstore', 'checkout', null) ? 'store-in-stock' : 'store-error',
            quantity: inventoryRec ? inventoryRec.ATS.value : 0,
            address1: store.address1,
            city: store.city,
            stateCode: store.stateCode,
            postalCode: store.postalCode
        });
    }

    let r = require('~/cartridge/scripts/util/Response');
    r.renderJSON(stores);
}

/**
 * Sets the preferred store for the session.
 */
function setPreferredStore() {
    session.custom.storeId = request.httpParameterMap.storeId.value;

    getPreferredStore();
}

/**
 * Gets the preferred store from the session.
 */
function getPreferredStore() {
    let r = require('~/cartridge/scripts/util/Response');
    r.renderJSON([{
        storeId: session.custom.storeId
    }]);
}

/**
 * Sets the users zip code for at the session.
 */
function setZipCode() {
    session.custom.zipcode = request.httpParameterMap.zipCode.value;

    getZipCode();
}

/**
 * Gets the users zip code from the session.
 */
function getZipCode() {
    let r = require('~/cartridge/scripts/util/Response');
    r.renderJSON([{
        zip: session.custom.zipcode
    }]);
}

/*
 * Private helpers
 */

/**
 * Looks up stores based on the zipcode given and the site prefernces that refer
 * to the radius and units of distance.
 */
function lookupByZipCode() {
    var nearestStores = dw.catalog.StoreMgr.searchStoresByPostalCode(
        dw.system.Site.getCurrent().getCustomPreferenceValue('countryCode').value,
        request.httpParameterMap.zipCode.value,
        'mi',
        Number(dw.system.Site.getCurrent().getCustomPreferenceValue('storeLookupMaxDistance').value));

    session.custom.zipcode = request.httpParameterMap.zipCode.value;

    return {
        Stores: nearestStores.keySet(),
        StoresCount: nearestStores.size()
    };
}

/**
 * Assumes that the pid refers to a product line item instead of a product
 * object for determining a product's availability.
 */
function getProductLineItem(uuid) {
    var Cart = app.getModel('Cart');
    var cart = Cart.get();
    if (cart) {
        for (var i = 0; i < cart.object.productLineItems.length; i++) {
            var lineItem = cart.object.productLineItems[i];

            if (lineItem.UUID === uuid) {
                return lineItem;
            }
        }
    }

    return null;
}

/**
 * Sets the store and its inventory list for the given line item.
 *
 * @param {dw.order.Basket} basket      The current basket.
 * @param {String} liUUID      The UUID of the line item.
 * @param {String} storeId     The ID of the store.
 * @param {String} storepickup
 * @transaction
 */
function setStoreInLineItem(basket, liUUID, storeId, storepickup) {
    var args = {};
    var lineItemItr = basket.allProductLineItems.iterator();
    var productLineItem;

    dw.system.Transaction.wrap(function () {
        while (lineItemItr.hasNext()) {
            productLineItem = lineItemItr.next();
            if (productLineItem.UUID === liUUID) {
                if (storepickup.equalsIgnoreCase('true')) {
                    if (productLineItem.product.custom.availableForInStorePickup) {
                        if (!empty(storeId)) {
                            var store = dw.catalog.StoreMgr.getStore(storeId);
                            if (!empty(store) && !empty(store.custom.inventoryListId)) {
                                var storeinventory = dw.catalog.ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);
                                if (!empty(storeinventory)) {
                                    if (!empty(storeinventory.getRecord(productLineItem.productID)) && storeinventory.getRecord(productLineItem.productID).ATS.value >= productLineItem.quantityValue) {

                                        productLineItem.custom.fromStoreId = store.ID;
                                        productLineItem.setProductInventoryList(storeinventory);

                                    } else {
                                        args.ErrorCode = 'Not available in that quantity';
                                        return;
                                    }
                                } else {
                                    args.ErrorCode = 'Store inventory list does not exist';
                                    return;
                                }
                            } else {
                                args.ErrorCode = 'Store object not available';
                                return;
                            }
                        } else {
                            args.ErrorCode = 'No store ID available';
                            return;
                        }
                    } else {
                        args.ErrorCode = 'Product not in store available';
                        return;
                    }
                } else {
                    productLineItem.custom.fromStoreId = '';
                    productLineItem.setProductInventoryList(null);
                    //Loop over the shipments to find the one with out instore to assign it to
                    //productLineItem.shipment = null;
                    //var shipmentToDelete
                    //check if the default shipment is instore or not
                    productLineItem.setShipment(basket.getDefaultShipment());
                }
                break;
            }
        }
    });

    return args;
}

/**
 * Gets store availability for the given product.
 *
 * @param  {dw.util.Collection} stores          The stores.
 * @param  {dw.catalog.Product} product         The product to get the availability for.
 * @param  {dw.order.ProductLineItem} productLineItem The line item for the product.
 * @return {dw.util.HashMap}                 The availability map.
 */
function getStoreAvailabilityMap(stores, product, productLineItem) {
    var storesItr = stores.iterator();
    var store = null;
    var storeAvailabilityMessage = '';
    var storeAvailabilityMap = new dw.util.HashMap();

    while (storesItr.hasNext()) {

        store = storesItr.next();
        storeAvailabilityMessage = getStoreAvailabilityMessage(store, product);
        // the inventory check is for a pli consider the qty value for available stores
        if (productLineItem) {
            var storeinventory = dw.catalog.ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);
            if (!empty(storeinventory.getRecord(productLineItem.productID)) && storeinventory.getRecord(productLineItem.productID).ATS.value >= productLineItem.quantityValue) {
                storeAvailabilityMap.put(store.ID, storeAvailabilityMessage);
            }
        } else {
            storeAvailabilityMap.put(store.ID, storeAvailabilityMessage);
        }
    }

    return storeAvailabilityMap;
}

/**
 * Get the availability message for a given store and product.
 * @param  {dw.catalog.Store} store - The store.
 * @param  {dw.catalog.Product} product - The product.
 * @return {String}         The localized message.
 */
function getStoreAvailabilityMessage(store, product) {
    var storeInventoryListId = store.custom.inventoryListId;
    var productInventoryList = null;
    var productInventoryrecord = null;
    var availabilityMessage = dw.web.Resource.msg('cart.store.availableinstore','checkout',null); //"In stock"

    // check for Inventory Availability
    if (storeInventoryListId !== null) {
        productInventoryList = dw.catalog.ProductInventoryMgr.getInventoryList(storeInventoryListId);
        if (productInventoryList !== null) {
            productInventoryrecord = productInventoryList.getRecord(product.ID);
            if (productInventoryrecord !== null) {
                if (productInventoryrecord.ATS.value >= 1) {
                    //Instock
                    availabilityMessage = dw.web.Resource.msg('cart.store.availableinstore','checkout',null); //"In stock"
                } else {
                    // not available as ATS is less than 1
                    availabilityMessage = dw.web.Resource.msg('cart.store.notavailable','checkout',null); //"Not Available"
                }
            } else {
                // not available as Inventory Record doesn't exist
                availabilityMessage = dw.web.Resource.msg('cart.store.notavailable','checkout',null); //"Not Available"
            }
        } else {
            // not available as Inventory List doesn't exist
            availabilityMessage = dw.web.Resource.msg('cart.store.notavailable','storepickup',null); //"Not Available"
        }
    } else {
        // not available as Store Inventory is not set
        availabilityMessage = dw.web.Resource.msg('cart.store.notavailable','storepickup',null); //"Not Available"
    }

    return availabilityMessage;
}

/*
 * Web exposed methods
 */
/** @see module:controllers/StoreInventory~SetStore */
exports.SetStore = guard.ensure(['get'], setStore);
/** @see module:controllers/StoreInventory~ShowSelectedStoreCore */
exports.ShowSelectedStoreCore = guard.ensure(['get'], showSelectedStoreCore);
/** @see module:controllers/StoreInventory~ShowAvailableStores */
exports.ShowAvailableStores = guard.ensure(['get'], showAvailableStores);
/** @see module:controllers/StoreInventory~CartSetZipCodeCore */
exports.CartSetZipCodeCore = guard.ensure(['get'], cartSetZipCodeCore);
/** @see module:controllers/StoreInventory~SetZipCodeCore */
exports.SetZipCodeCore = guard.ensure(['post'], setZipCodeCore);
/** @see module:controllers/StoreInventory~SetStoreCore */
exports.SetStoreCore = guard.ensure(['get'], setStoreCore);
/** @see module:controllers/StoreInventory~Inventory */
exports.Inventory = guard.ensure(['get'], inventory);
/** @see module:controllers/StoreInventory~SetPreferredStore */
exports.SetPreferredStore = guard.ensure(['post'], setPreferredStore);
/** @see module:controllers/StoreInventory~GetPreferredStore */
exports.GetPreferredStore = guard.ensure(['get'], getPreferredStore);
/** @see module:controllers/StoreInventory~SetZipCode */
exports.SetZipCode = guard.ensure(['post'], setZipCode);
/** @see module:controllers/StoreInventory~GetZipCode */
exports.GetZipCode = guard.ensure(['get'], getZipCode);
