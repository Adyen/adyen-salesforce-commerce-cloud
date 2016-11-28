'use strict';

/**
 * Controller for the multishipping scenario. Multishipping involves more
 * than one shipment, shipping address, and/or shipping method per order.
 *
 * @module controllers/COShippingMultiple
 */

/* API Includes */
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var Cart = app.getModel('Cart');
var TransientAddress = app.getModel('TransientAddress');

/**
 * Starting point for multishipping scenario. Renders a page providing address selection for each product line item.
 *
 * @transaction
 */
function start() {
    var cart = Cart.get();

    if (cart) {

        // Stores session and customer addresses in sessionAddressBook attribute.
        Transaction.wrap(function () {
            cart.initAddressBook(customer);
        });

        // Creates for each quantity of ProductLineItems new QuantityLineItems helper objects.
        var quantityLineItems = null;
        var plis = cart.getProductLineItems();
        for (var i = 0; i < plis.length; i++) {
            quantityLineItems = cart.separateQuantities(plis[i], quantityLineItems);
        }

        initAddressForms(cart, quantityLineItems);

        app.getController('COShipping').PrepareShipments();
        Transaction.wrap(function () {
            cart.calculate();
        });

        app.getView({
            Basket: cart.object,
            ContinueURL: URLUtils.https('COShippingMultiple-MultiShippingAddresses')
        }).render('checkout/shipping/multishipping/multishippingaddresses');
    } else {
        app.getController('Cart').Show();
        return;
    }
}

/**
 * Form handler for multishipping form. Handles the save action. Updates the cart calculation, creates shipments
 * and renders the multishippingaddress template.
 */
function multiShippingAddresses() {
    var multiShippingForm = app.getForm('multishipping');

    multiShippingForm.handleAction({
        save: function () {
            var cart = Cart.get();

            var result = Transaction.wrap(function () {
                var MergeQuantities = require('app_storefront_core/cartridge/scripts/checkout/multishipping/MergeQuantities');
                var ScriptResult = MergeQuantities.execute({
                    CBasket: cart.object,
                    QuantityLineItems: session.forms.multishipping.addressSelection.quantityLineItems
                });
                return ScriptResult;
            });

            if (result) {
                Transaction.wrap(function () {
                    cart.calculate();
                });

                multiShippingForm.setValue('addressSelection.fulfilled', true);

                startShipments();
                return;
            } else {
                app.getView({
                    Basket: cart.object,
                    ContinueURL: URLUtils.https('COShippingMultiple-MultiShippingAddresses')
                }).render('checkout/shipping/multishipping/multishippingaddresses');
                return;
            }
        }
    });
}

/**
 * The second step of multishipping: renders a page for each shipment, providing a shipping method selection per shipment.
 * If a basket exists, renders the multishippingshipments template. If no basket exists, calls the
 * {@link module:controllers/Cart~Show|Cart controller Show function}.
 * @transaction
 */
function startShipments() {
    var cart = Cart.get();

    if (cart) {

        app.getController('COShipping').PrepareShipments();

        // Initializes the forms for the multishipment setting.
        session.forms.multishipping.shippingOptions.clearFormElement();

        app.getForm(session.forms.multishipping.shippingOptions.shipments).copyFrom(cart.getShipments());

        // Initializes the shipping method list for each shipment.
        var count = session.forms.multishipping.shippingOptions.shipments.childCount;
        for (var i = 0; i < count; i++) {
            var shipmentForm = session.forms.multishipping.shippingOptions.shipments[i];
            var shippingMethods = ShippingMgr.getShipmentShippingModel(shipmentForm.object).applicableShippingMethods;

            shipmentForm.shippingMethodID.setOptions(shippingMethods.iterator());
        }

        Transaction.wrap(function () {
            cart.calculate();
        });

        app.getView({
            Basket: cart.object,
            ContinueURL: URLUtils.https('COShippingMultiple-MultiShippingMethods')
        }).render('checkout/shipping/multishipping/multishippingshipments');
    } else {
        app.getController('Cart').Show();
        return;
    }
}

/**
 * Form handler for the multishipping form. Handles the save action.
 * Sets the shipping method for each shipment and copies it to the shipmentForm.
 * If the copy fails, it renders the multishippingshipments template. If it succeeds,
 * it calls the {@link module:controllers/COBilling~Start|COBilling controller Start function}.
 * @transaction
 */
function multiShippingMethods() {
    var multiShippingForm = app.getForm('multishipping');

    multiShippingForm.handleAction({
        save: function () {
            Transaction.wrap(function () {
                var count = session.forms.multishipping.shippingOptions.shipments.childCount;
                for (var i = 0; i < count; i++) {
                    var shipmentForm = session.forms.multishipping.shippingOptions.shipments[i];

                    if (shipmentForm.shippingMethodID.selectedOptionObject !== null) {
                        shipmentForm.getObject().setShippingMethod(shipmentForm.shippingMethodID.selectedOptionObject);
                    }

                    if (!app.getForm(shipmentForm).copyTo(shipmentForm.object)) {
                        app.getView({
                            Basket: Cart.get().object,
                            ContinueURL: URLUtils.https('COShippingMultiple-MultiShippingMethods')
                        }).render('checkout/shipping/multishipping/multishippingshipments');
                        return;
                    }
                }
            });

            // Mark step as fulfilled.
            session.forms.multishipping.shippingOptions.fulfilled.value = true;

            app.getController('COBilling').Start();
            return;
        }
    });
}

/**
 * Initializes the forms for the multiaddress selection.
 */
function initAddressForms(cart, quantityLineItems) {

    // Set flag, that customer has entered the multi shipping scenario.
    session.forms.multishipping.entered.value = true;

    if (!session.forms.multishipping.addressSelection.fulfilled.value) {
        session.forms.multishipping.addressSelection.clearFormElement();
        app.getForm(session.forms.multishipping.addressSelection.quantityLineItems).copyFrom(quantityLineItems);
    }

    var addresses = cart.getAddressBookAddresses();

    if (!addresses) {
        start();
        return;
    } else {
        for (var i = 0; i < session.forms.multishipping.addressSelection.quantityLineItems.childCount; i++) {
            var quantityLineItem = session.forms.multishipping.addressSelection.quantityLineItems[i];
            quantityLineItem.addressList.setOptions(addresses.iterator());
        }

    }
}

/**
 * Renders a form dialog to edit an address. The dialog is opened by an Ajax request and renders templates,
 * which trigger a JavaScript event. The calling page of this dialog is responsible for handling these events.
 */
function editAddresses() {
    var cart = Cart.get();

    if (cart) {

        session.forms.multishipping.editAddress.clearFormElement();

        var addresses = cart.getAddressBookAddresses();

        if (!addresses) {
            start();
            return;
        } else {
            session.forms.multishipping.editAddress.addressList.setOptions(addresses.iterator());
            app.getView({
                Basket: cart.object,
                ContinueURL: URLUtils.https('COShippingMultiple-EditForm')
            }).render('checkout/shipping/multishipping/editaddresses');
        }

        return;
    } else {
        app.getController('Cart').Show();
        return;
    }
}

/**
 * Form handler for the multishipping form. Handles the following actions:
 * - __cancel__ - calls the {@link module:controllers/COShippingMultiple~start|start function}.
 * - __save__ - calls the {@link module:controllers/COShippingMultiple~addEditAddress|addEditAddress function}. If it returns an error, renders the editaddresses template.
 * - __selectAddress__ - clears the multishipping form and calls the {@link module:controllers/COShippingMultiple~editAddress|editAddress function}.
 */
function editForm() {
    var multiShippingForm = app.getForm('multishipping');

    multiShippingForm.handleAction({
        cancel: function () {
            start();
            return;
        },
        save: function () {
            var addEditAddressResult = addEditAddress();
            if (addEditAddressResult.error) {
                app.getView({
                    ContinueURL: URLUtils.https('COShippingMultiple-EditForm')
                }).render('checkout/shipping/multishipping/editaddresses');
                return;
            }

            start();
            return;
        },
        selectAddress: function () {
            if (!session.forms.multishipping.editAddress.addressList.selectedOption) {

                session.forms.multishipping.editAddress.clearFormElement();
                editAddresses();

                return;
            }

            app.getForm(session.forms.multishipping.editAddress.addressFields).copyFrom(session.forms.multishipping.editAddress.addressList.selectedOptionObject);
            app.getForm(session.forms.multishipping.editAddress.addressFields.states).copyFrom(session.forms.multishipping.editAddress.addressList.selectedOptionObject);
            app.getView({
                Basket: Cart.get().object,
                ContinueURL: URLUtils.https('COShippingMultiple-EditForm')
            }).render('checkout/shipping/multishipping/editaddresses');

            return;
        }
    });
}

/**
  * Creates a new transient address. Attempts to copy address information from the multishipping form to the transient address.
  * Updates the customer address book. Updates the session address book.
  * If address information cannot be saved to the transient address, returns a JSON object containing success and error information.
 * @returns {object} JSON object indicating success, error and/or address information.
 */
function addEditAddress() {
    var cart = Cart.get();

    var newAddress = new TransientAddress();
    newAddress.UUID = UUIDUtils.createUUID();

    if (!app.getForm(session.forms.multishipping.editAddress.addressFields).copyTo(newAddress) || !app.getForm(session.forms.multishipping.editAddress.addressFields.states).copyTo(newAddress)) {
        return {success: false, error: true};
    } else {

        var referenceAddress = session.forms.multishipping.editAddress.addressList.selectedOptionObject;
        var addToCustomerAddressBook = session.forms.multishipping.editAddress.addToAddressBook.checked;
        var customerAddress = null;

        // Handles customer address book update process.
        if (addToCustomerAddressBook && addToCustomerAddressBook === true) {
            if (referenceAddress) {
                // Gets address from address book.
                if (referenceAddress.ID) {
                    customerAddress = customer.addressBook.getAddress(referenceAddress.ID);
                }
            } else {
                customerAddress = Transaction.wrap(function () {
                    return app.getModel('Profile').get(customer.profile).addAddressToAddressBook(newAddress);
                });
                newAddress.ID = customerAddress.ID;
                newAddress.referenceAddressUUID = customerAddress.getUUID();
            }

            if (customerAddress) {
                var helperAddress = new TransientAddress();
                helperAddress.copyFrom(newAddress);
                Transaction.wrap(function () {
                    helperAddress.copyTo(customerAddress);
                });
            }
        }

        // Handle session address book update process
        if (referenceAddress) {
            // Update Address
            newAddress.UUID = referenceAddress.UUID;
            Transaction.wrap(function () {
                cart.updateAddressBookAddress(newAddress);
            });
        } else {
            Transaction.wrap(function () {
                cart.addAddressToAddressBook(newAddress);
            });
        }

        for (var i = 0; i < session.forms.multishipping.addressSelection.quantityLineItems.childCount; i++) {
            var quantityLineItem = session.forms.multishipping.addressSelection.quantityLineItems[i];
            quantityLineItem.addressList.setOptions(cart.getAddressBookAddresses().iterator());
        }

        return {success: true, address: newAddress};
    }
}

/**
 * Calls the {@link module:controllers/COShippingMultiple~addEditAddress|addEditAddress function} and renders a JSON message
 * with information about the address and the success of the edit.
 */
function addEditAddressJSON() {
    var addEditAddressResult = addEditAddress();

    let r = require('~/cartridge/scripts/util/Response');
    r.renderJSON({
        address: addEditAddressResult.address,
        success: addEditAddressResult.success
    });
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** Starting point for multishipping scenario.
 * @see module:controllers/COShippingMultiple~start */
exports.Start = guard.ensure(['https'], start);
/** The second step of multishipping: renders a page for each shipment, providing a shipping method selection per shipment.
 * @see module:controllers/COShippingMultiple~startShipments */
exports.StartShipments = guard.ensure(['https', 'get'], startShipments);
/** Renders a form dialog to edit an address.
 * @see module:controllers/COShippingMultiple~editAddresses */
exports.EditAddresses = guard.ensure(['https', 'get'], editAddresses);
/** Edits addresses and updates the customer address book and the session address book. Renders a JSON message indicating success or failure.
 * @see module:controllers/COShippingMultiple~addEditAddressJSON */
exports.AddEditAddressJSON = guard.ensure(['https', 'get'], addEditAddressJSON);
/** Form handler for multishipping form. Handles the save action.
 * @see module:controllers/COShippingMultiple~multiShippingAddresses */
exports.MultiShippingAddresses = guard.ensure(['https', 'post'], multiShippingAddresses);
/** Form handler for multishipping form. Handles the save action.
 * @see module:controllers/COShippingMultiple~multiShippingMethods */
exports.MultiShippingMethods = guard.ensure(['https', 'post'], multiShippingMethods);
/** Form handler for multishipping form. Handles cancel, save, and selectAddress actions.
 * @see module:controllers/COShippingMultiple~editForm */
exports.EditForm = guard.ensure(['https', 'post'], editForm);
