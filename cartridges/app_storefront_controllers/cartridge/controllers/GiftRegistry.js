'use strict';

/**
 * Controller for gift registry business logic.
 *
 * @module  controllers/GiftRegistry
 */

/* API Includes */
var giftRegistryType = require('dw/customer/ProductList').TYPE_GIFT_REGISTRY;
var GiftCertProductListItem = require('dw/customer/ProductListItem').TYPE_GIFT_CERTIFICATE;
var ProductListMgr = require('dw/customer/ProductListMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Content = app.getModel('Content');
var ProductList = app.getModel('ProductList');
var Form = app.getModel('Form');

/**
 * Renders a list of gift registries associated with the current customer.
 * Clears the productlists form and gets the product lists associated with a customer. Gets the
 * myaccount-giftregistry content asset, updates the page metadata and renders the registry list
 * page (account/giftregistry/registrylist template).
 */
function start() {
    var accountGiftRegistry = Content.get('myaccount-giftregistry');
    var pageMeta = require('~/cartridge/scripts/meta');
    var productLists = ProductListMgr.getProductLists(customer, giftRegistryType);
    var productListsForm = Form.get('productlists');
    var productListItems = productListsForm.get('items');

    pageMeta.update(accountGiftRegistry);

    Form.get(productListsForm).clear();
    productListItems.copyFrom(productLists);

    app.getView({
        ContinueURL: URLUtils.https('GiftRegistry-SubmitForm')
    }).render('account/giftregistry/registrylist');
}

/**
 * Controls the form submission that is required to access gift registry actions.
 */
function submitForm() {
    Form.get('giftregistry').handleAction({
        addToCart: function (form) {
            var cart = app.getModel('Cart').goc();

            if (form.items.triggeredAction.parent.object.type === GiftCertProductListItem) {
                response.redirect(URLUtils.https('GiftCert-Purchase'));
            } else {
                var renderInfo = cart.addProductToCart();

                if (renderInfo.template === 'checkout/cart/cart') {
                    app.getView('Cart', {
                        Basket: cart
                    }).render(renderInfo.template);
                } else if (renderInfo.format === 'ajax') {
                    app.getView('Cart', {
                        cart: cart,
                        BonusDiscountLineItem: renderInfo.newBonusDiscountLineItem
                    }).render(renderInfo.template);
                } else {
                    response.redirect(URLUtils.url('Cart-Show'));
                }

            }
        },

        create: createOne,

        confirm: confirm,

        deleteItem: function (form, action) {
            var productListItem = action.object;
            var productList = ProductList.get(productListItem.list);

            productList.removeItem(productListItem);

            showRegistry({ProductList: productList.object});
        },

        public: function (form, action) {
            var productListItem = action.object;
            productListItem.setPublic(productListItem.public);
        },

        search: function (form, action) {
            var CSRFProtection = require('dw/web/CSRFProtection');

            if (!CSRFProtection.validateRequest()) {
                if (request.httpParameterMap.format.stringValue === 'ajax') {
                    app.getModel('Customer').logout();
                    let r = require('~/cartridge/scripts/util/Response');
                    r.renderJSON({
                        error: 'CSRF Token Mismatch'
                    });
                    return null;
                } else {
                    app.getModel('Customer').logout();
                    app.getView().render('csrf/csrffailed');
                    return null;
                }
            }

            var productLists = ProductList.search(action.parent.simple, giftRegistryType);

            app.getView({ProductLists: productLists}).render('account/giftregistry/giftregistryresults');
        },

        setParticipants: setParticipants,

        setBeforeAfterAddresses: handleRegistryAddresses,

        setPublic: function (form, action) {
            var productList = action.object;
            setProductListPublic(productList, true);
        },

        setPrivate: function (form, action) {
            var productList = action.object;
            setProductListPublic(productList, false);
        },

        updateItem: function (form, action) {
            var productList = ProductList.get(action.object.list);
            productList.updateItem(form.items);

            showRegistry({ProductList: productList.object});
        },

        addGiftCertificate: function (form) {
            var productList = ProductList.get(form.object);

            Transaction.wrap(function () {
                productList.createGiftCertificateItem();
            });

            showRegistry({ProductList: productList.object});
        },

        navPurchases: function (form) {
            var productList = ProductList.get(form.object);
            app.getView({
                ProductList: productList.object
            }).render('account/giftregistry/purchases');
        },

        navEvent: function (form) {
            var productList = ProductList.get(form.object);
            editParticipant(productList.object, form);
        },

        navShipping: function(form) {
            var productList = ProductList.get(form.object);
            editEventAddresses(productList.object, form);
        },

        navRegistry: function(form) {
            var productList = ProductList.get(form.object);
            showRegistry({
                ProductList: productList.object
            });
        }
    });
}

/**
 * Adds a product to the gift registry. The product must either be a Product object, or is identified by its
 * product ID using the dictionary key ProductID or, if empty, uses the HTTP parameter "pid".
 */
function addProduct() {
    var params = request.httpParameterMap;
    var productId = params.pid.stringValue;
    var ProductModel = app.getModel('Product');
    var product;
    var productList;
    var productLists;
    var qtyProductLists;

    if (productId) {
        product = ProductModel.get(productId);
    } else {
        throw 'Product ID required but not provided.';
    }

    productLists = ProductListMgr.getProductLists(customer, giftRegistryType);
    qtyProductLists = productLists.size();

    if (productLists && qtyProductLists) {
        if (qtyProductLists === 1) {
            productList = ProductList.get(productLists.iterator().next());
            productList.addProduct(product.object);
        } else {
            selectOne();
            return;
        }
    } else {
        createOne();
        return;
    }

    showRegistry({
        ProductList: productList.object
    });
}


/**
 * Initiates the creation of a gift registry entry in three stages:
 *     1) Specify event participants
 *     2) Specify pre- and post-event addresses
 *     3) Confirm Gift Registry details
 * Renders the event participant page (account/giftregistry/eventparticipant template).
 */
function createOne() {
    var giftRegistryForm = Form.get('giftregistry');
    var participant = giftRegistryForm.get('event.participant');
    var profile = customer.profile;

    giftRegistryForm.clear();

    participant.setValue('firstName', profile.firstName);
    participant.setValue('lastName', profile.lastName);
    participant.setValue('email', profile.email);

    app.getView().render('account/giftregistry/eventparticipant');
}

/**
 * Event handler for gift registry addresses.
 * Checks the last triggered action and handles them depending on the formId associated with the triggered action.
 * If the formId is:
 * - __back__ - calls the {@link module:controllers/GiftRegistry~start|start} function
 * - __confirm__ - if there are no addresses in the customer address book, sets a flag to indicate the
 * before event shipping address is new. Calls the {@link module:controllers/GiftRegistry~setParticipants|setParticipants} function.
 * @FIXME Doesn't appear to ever be called.
 */
function eventParticipant() {
    var currentForms = session.forms;

    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'back') {
            start();
            return;
        } else if (TriggeredAction.formId === 'confirm') {
            if (customer.profile.addressBook.addresses.size() === 0) {
                currentForms.giftregistry.eventaddress.beforeEventAddress.value = 'newaddress';
            }

            setParticipants();
        }
    }
}

/**
 * Renders the gift registry addresses page (account/giftregistry/addresses template).
 */
function setParticipants() {
    app.getView().render('account/giftregistry/addresses');
}

/**
 * Renders the gift registry confirmation page (account/giftregistry/giftregistryconfirmation template).
 */
function handleRegistryAddresses() {
    app.getView().render('account/giftregistry/giftregistryconfirmation');
}

/**
 * Selects a gift registry from a list of gift registries that are found by the registry search.
 * Called by {@link module:controllers/GiftRegistry~addProduct}.
 */
function selectOne() {
    var currentForms = session.forms;
    var ProductLists = ProductListMgr.getProductLists(customer, giftRegistryType);

    Form.get(currentForms.productlists.items).copyFrom(ProductLists);

    app.getView().render('account/giftregistry/registryselect');
}

/**
 * Makes a ProductList public or private
 *
 * @param {dw.customer.ProductList} productList
 * @param {Boolean} isPublic - true to make public; false to make private
 */
function setProductListPublic (productList, isPublic) {
    var productListWrapper = ProductList.get(productList);
    productListWrapper.setPublic(isPublic);

    showRegistry({ProductList: productListWrapper.object});
}

/**
 * Provides actions to edit a gift registry event.
 */
function selectProductListInteraction() {

    var TriggeredAction = request.triggeredFormAction;
    if (TriggeredAction !== null) {
        if (TriggeredAction.formId === 'select') {


            //var ProductList = TriggeredAction.object;

            // where to continue now?
            return;
        }
    }


}

/**
 * Clears the giftregistry form and prepopulates event and participant information from the current ProductListModel.
 * Calls the {@link module:controllers/GiftRegistry~showEditParticipantForm|showEditParticipantForm} function.
 */
function editParticipant(productList, giftRegistryForm) {
    var eventForm = app.getForm(giftRegistryForm.event);
    var participantForm = app.getForm(giftRegistryForm.event.participant);
    var coParticipantForm =  app.getForm(giftRegistryForm.event.coParticipant);

    eventForm.clear();
    participantForm.clear();
    coParticipantForm.clear();

    eventForm.copyFrom(productList);
    participantForm.copyFrom(productList.registrant);

    if (productList.coRegistrant) {
        coParticipantForm.copyFrom(productList.coRegistrant);
    }

    app.getForm(giftRegistryForm.event.eventaddress.states).setValue('state', productList.eventState);
    app.getForm(giftRegistryForm.event.eventaddress).setValue('country', productList.eventCountry);

    // Renders the event participant page (account/giftregistry/eventparticipant template).
    app.getView({
        ProductList: productList,
        ContinueURL: URLUtils.https('GiftRegistry-EditEvent')
    }).render('account/giftregistry/eventparticipant');
}

function editEvent() {
    Form.get('giftregistry').handleAction({
        setParticipants: function (form) {
            var productList = ProductList.get(form.object);

            Transaction.wrap(function () {
                app.getForm(form.event).copyTo(productList.object);
                app.getForm(form.event.participant).copyTo(productList.object.registrant);
                productList.object.setEventState(form.event.eventaddress.states.state.value);
                productList.object.setEventCountry(form.event.eventaddress.country.value);

                if (form.event.coParticipant.firstName.value || form.event.coParticipant.lastName.value) {
                    if (!productList.object.coRegistrant) {
                        productList.object.createCoRegistrant();
                    }
                    app.getForm(form.event.coParticipant).copyTo(productList.object.coRegistrant);
                }
            });

            showRegistry({
                ProductList: productList.object
            });
        },

        navPurchases: function (form) {
            var productList = ProductList.get(form.object);
            app.getView({
                ProductList: productList.object
            }).render('account/giftregistry/purchases');
        },

        navEvent: function (form) {
            var productList = ProductList.get(form.object);
            editParticipant(productList.object, form);
        },

        navShipping: function(form) {
            var productList = ProductList.get(form.object);
            editEventAddresses(productList.object, form);
        },

        navRegistry: function(form) {
            var productList = ProductList.get(form.object);
            showRegistry({
                ProductList: productList.object
            });
        },

        setBeforeAfterAddresses: function(form) {
            var assignEventAddresses = require('app_storefront_core/cartridge/scripts/account/giftregistry/AssignEventAddresses');
            var productList = ProductList.get(form.object);

            Transaction.wrap(function () {
                assignEventAddresses.assignEventAddresses({
                    ProductList: productList.object,
                    Customer: customer,
                    GiftRegistryForm: form
                });
            });

            showRegistry({
                ProductList: productList.object
            });

        }

    })
}

function editEventAddresses(productList, eventAddressForm) {
    app.getForm(eventAddressForm.eventaddress).clear();
    if (productList.shippingAddress) {
        app.getForm(eventAddressForm.eventaddress.addressBeforeEvent).copyFrom(productList.shippingAddress);
        app.getForm(eventAddressForm.eventaddress.addressBeforeEvent.states).setValue('state', productList.shippingAddress.stateCode);
    }

    if (productList.postEventShippingAddress) {
        app.getForm(eventAddressForm.eventaddress.addressAfterEvent).copyFrom(productList.postEventShippingAddress);
        app.getForm(eventAddressForm.eventaddress.addressAfterEvent.states).setValue('state', productList.postEventShippingAddress.stateCode);
    }

    app.getView({
        ProductList: productList,
        ContinueURL: URLUtils.https('GiftRegistry-EditEvent')
    }).render('account/giftregistry/addresses');
}

/**
 * Renders a gift registry details page (account/giftregistry/registry template) and provides basic actions such as item updates and publishing.
 * @param {Object} pdict
 */
function showRegistry(pdict) {
    var ProductList = pdict.ProductList;

    Form.get('giftregistry').copyFrom(ProductList);
    Form.get('giftregistry.event').copyFrom(ProductList);

    app.getView({
        Status: null,
        ProductList: ProductList,
        ContinueURL: URLUtils.https('GiftRegistry-SubmitForm')
    }).render('account/giftregistry/registry');
}

/**
 * Looks up a gift registry by its public UUID. If the customer is authenticated, it calls
 * the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function. If the customer
 * is not authenticated, it calls calls the {@link module:controllers/Account~show|Account
 * controller show function}.
 */
function showRegistryByID() {
    var currentHttpParameterMap = request.httpParameterMap;
    var productList;

    if (!customer.authenticated) {
        response.redirect(URLUtils.https('Account-Show'));
        return;
    }

    productList = ProductListMgr.getProductList(currentHttpParameterMap.ProductListID.value);

    if (!productList) {
        start();
        return;
    }

    if (productList.owner.profile.customerNo === customer.profile.customerNo) {
        showRegistry({
            ProductList: productList
        });
        return;
    }
}

/**
 * Handles the confirm action for the giftregistry form. Checks to makes sure the before and after
 * event addresses do not already exist in the customer profile. If the addresses are duplicates,
 * calls the {@link module:controllers/GiftRegistry~setParticipants|setParticipants} function.
 * If they are not duplicates, calls the AssignEventAddresses.js script to assign the event addresses
 * to the product list and then calls the {@link module:controllers/GiftRegistry~showRegistry|showRegistry} function.
 *
 * @transaction
 * @returns {Object} JSON object indicating an error occurred in the AssignEventAddresses.js script.
 */
function confirm() {
    var giftRegistryForm = Form.get('giftregistry');
    var dwProductList = Transaction.wrap(function () {
        return ProductListMgr.createProductList(customer, giftRegistryType);
    });
    var productList = ProductList.get(dwProductList);

    Transaction.wrap(function () {
        var assignEventAddresses = require('app_storefront_core/cartridge/scripts/account/giftregistry/AssignEventAddresses');
        var eventForm = Form.get('giftregistry.event');
        var participantForm = Form.get('giftregistry.event.participant');

        eventForm.copyTo(productList.object);
        productList.createRegistrant();
        participantForm.copyTo(productList.object.registrant);
        productList.setEventState(giftRegistryForm.getValue('event.eventaddress.states.state'));

        assignEventAddresses.assignEventAddresses({
            ProductList: productList.object,
            Customer: customer,
            GiftRegistryForm: giftRegistryForm.object
        });
    });

    showRegistry({ProductList: productList.object});
}

/**
 * Deletes a gift registry. Only the logged-in owner of the gift registry can delete it.
 *
 * @secure
 */
// Used 'deleteList' rather than 'delete' as the latter is a reserved word in Javascript
function deleteList() {
    var params = request.httpParameterMap;
    var productList = ProductList.get(params.ProductListID.value);
    productList.remove();

    start();
}


/**
 * Creates a gift registry. Calls the {@link module:controllers/GiftRegistry~createOne|createOne} function.
 */
function create() {
    createOne();
}


// function updateAll() {
//     var currentForms = session.forms;

//
//     for (var i = 0; i < currentForms.giftregistry.items.length; i++) {
//         var item = currentForms.giftregistry.items[i];
//         if (!Form.get(item).copyTo(item.object)) {
//             return {
//                 error: true
//             };
//         }
//     }
// }


/**
 * Web exposed methods
 */

/**
 * Creates a gift registry.
 * @see module:controllers/GiftRegistry~start
 */
exports.Create = guard.ensure(['get', 'https'], create);

/**
 * Deletes a gift registry.
 * @see module:controllers/GiftRegistry~confirmation
 */
exports.Delete = guard.ensure(['get', 'https'], deleteList);

/**
 * Event handler for editing of gift registry.
 * @see module:controllers/GiftRegistry~editEvent
 */
exports.EditEvent = guard.ensure(['post', 'https'], editEvent);

/**
 * Event handler for gift registry addresses.
 * @see module:controllers/GiftRegistry~eventParticipant
 */
exports.EventParticipant = guard.ensure(['post', 'https'], eventParticipant);

/**
 * Provides actions to edit a gift registry event.
 * @see module:controllers/GiftRegistry~selectProductListInteraction
 */
exports.SelectProductListInteraction = guard.ensure(['post', 'https'], selectProductListInteraction);

/**
 * Looks up a gift registry by its public UUID.
 * @see module:controllers/GiftRegistry~showRegistryByID
 */
exports.ShowRegistryByID = guard.ensure(['get', 'https'], showRegistryByID);

/**
 * Controls the login that is required to access gift registry actions.
 * @see module:controllers/GiftRegistry~submitForm
 */
exports.SubmitForm = guard.ensure(['post', 'https', 'loggedIn'], submitForm);

/**
 * Renders a list of gift registries associated with the current customer.
 * @see module:controllers/GiftRegistry~start
 */
exports.Start = guard.ensure(['get', 'https', 'loggedIn'], start, {scope: 'giftregistry'});

/**
 * Adds a product to the gift registry.
 * @see module:controllers/GiftRegistry~addProduct
 */
exports.AddProduct = guard.ensure(['get', 'https', 'loggedIn'], addProduct);

/**
 * Renders the gift registry details page.
 * @see module:controllers/GiftRegistry~showRegistry
 */
exports.ShowRegistry = showRegistry;
