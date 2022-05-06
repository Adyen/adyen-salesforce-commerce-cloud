'use strict';

/**
 * Controller that provides functions for editing, adding, and removing addresses in a customer addressbook.
 * It also sets the default address in the addressbook.
 * @module controllers/Address
 */

/* API Includes */
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Gets a ContentModel that wraps the myaccount-addresses content asset.
 * Updates the page metadata and renders the addresslist template.
 */
function list() {
    var pageMeta = require('~/cartridge/scripts/meta');

    var content = app.getModel('Content').get('myaccount-addresses');
    if (content) {
        pageMeta.update(content.object);
    }

    app.getView().render('account/addressbook/addresslist');
}

/**
 * Clears the profile form and renders the addressdetails template.
 */
function add() {
    app.getForm('profile').clear();

    app.getView({
        Action: 'add',
        ContinueURL: URLUtils.https('Address-Form')
    }).render('account/addressbook/addressdetails');
}

/**
 * Gets an AddressModel object. Gets the customeraddress form.
 * Handles the address form actions:
 *  - cancel and error - if the HTTPParameterMap format value is ajax, returns an error message,
 * otherwise redirects to the Address-List controller function.
 *  - create - if the address is valid, creates the address. If address creation fails, redirects to the Address-Add controller.
 *  - edit - if the address is valid, updates the address. If the address is invalid or the update fails, displays an error message.
 *  - remove - removes the address. If the address removal fails, displays an error message.
 */
function handleForm() {
    var Address;
    var success;
    var message;

    Address = app.getModel('Address');

    var addressForm = app.getForm('customeraddress');

    addressForm.handleAction({
        cancel: function () {
            success = false;
        },
        create: function () {
            if (!session.forms.profile.address.valid || !Address.create(session.forms.profile.address)) {
                response.redirect(URLUtils.https('Address-Add'));
                success = false;
            }

            success = true;
        },
        edit: function () {
            if (!session.forms.profile.address.valid) {
                success = false;
                message = 'Form is invalid';
            }
            try {
                Address.update(request.httpParameterMap.addressid.value, session.forms.profile.address);
                success = true;
            } catch (e) {
                success = false;
                message = e.message;
            }
        },
        error: function () {
            success = false;
        },
        remove: function () {
            if (Address.remove(session.forms.profile.address.addressid.value)) {
                success = false;
            }
        }
    });

    if (request.httpParameterMap.format.stringValue === 'ajax') {
        let r = require('~/cartridge/scripts/util/Response');

        r.renderJSON({
            success: success,
            message: message
        });
        return;
    }

    response.redirect(URLUtils.https('Address-List'));
}

/**
 * Clears the profile form and gets the addressBook for the current customer.
 * Copies address information from the stored customer profile into the profile form.
 * Renders the addressdetails form and passes the address information to the template.
 */
function edit() {
    var profileForm, addressBook, address;

    profileForm = session.forms.profile;
    app.getForm('profile').clear();

    // Gets address to be edited.
    addressBook = customer.profile.addressBook;
    address = addressBook.getAddress(request.httpParameterMap.AddressID.value);

    app.getForm(profileForm.address).copyFrom(address);
    app.getForm(profileForm.address.states).copyFrom(address);

    app.getView({
        Action: 'edit',
        ContinueURL: URLUtils.https('Address-Form'),
        Address: address
    }).render('account/addressbook/addressdetails');
}

/**
 * Gets the addressBook for the current customer. Gets an address from the addressBook based on the Address ID in the httpParameterMap.
 * Sets the default address. Redirects to the Address-List controller function.
 */
function setDefault() {
    var addressBook, address;

    addressBook = customer.profile.addressBook;
    address = addressBook.getAddress(request.httpParameterMap.AddressID.value);

    Transaction.wrap(function () {
        addressBook.setPreferredAddress(address);
    });

    response.redirect(URLUtils.https('Address-List'));
}

/**
 * Gets the addressBook for the current customer Returns a customer address as a JSON response by rendering the
 * addressjson template. Required to fill address form with selected address from address book.
 */
function getAddressDetails() {
    var addressBook = customer.profile.addressBook;
    var address = addressBook.getAddress(request.httpParameterMap.addressID.value);

    app.getView({
        Address: address
    }).render('account/addressbook/addressjson');
}

/**
 * Removes an address based on the Address ID in the httpParameterMap. If the httpParameterMap format value is set to ajax,
 * redirects to the Address-List controller function. Otherwise, renders an error message.
 */
function Delete() {
    var CustomerStatusCodes = require('dw/customer/CustomerStatusCodes');
    var deleteAddressResult = app.getModel('Address').remove(decodeURIComponent(request.httpParameterMap.AddressID.value));

    if (request.httpParameterMap.format.stringValue !== 'ajax') {
        response.redirect(URLUtils.https('Address-List'));
        return;
    }

    let r = require('~/cartridge/scripts/util/Response');

    r.renderJSON({
        status: deleteAddressResult ? 'OK' : CustomerStatusCodes.CUSTOMER_ADDRESS_REFERENCED_BY_PRODUCT_LIST,
        message: deleteAddressResult ? '' : Resource.msg('addressdetails.' + CustomerStatusCodes.CUSTOMER_ADDRESS_REFERENCED_BY_PRODUCT_LIST, 'account', null)
    });
}

/*
* Web exposed methods
*/
/** Lists addresses in the customer profile.
 * @see {@link module:controllers/Address~list} */
exports.List = guard.ensure(['get', 'https', 'loggedIn'], list);
/** Renders a dialog for adding a new address to the address book.
 * @see {@link module:controllers/Address~add} */
exports.Add = guard.ensure(['get', 'https', 'loggedIn'], add);
/** Renders a dialog for editing an existing address.
 * @see {@link module:controllers/Address~edit} */
exports.Edit = guard.ensure(['get', 'https', 'loggedIn'], edit);
/** The address form handler.
 * @see {@link module:controllers/Address~handleForm} */
exports.Form = guard.ensure(['post', 'https', 'loggedIn', 'csrf'], handleForm);
/** Sets the default address for the customer address book.
 * @see {@link module:controllers/Address~setDefault} */
exports.SetDefault = guard.ensure(['get', 'https', 'loggedIn'], setDefault);
/** Sets the default address.
 * @see {@link module:controllers/Address~getAddressDetails} */
exports.GetAddressDetails = guard.ensure(['get', 'https', 'loggedIn'], getAddressDetails);
/** Deletes an existing address.
 * @see {@link module:controllers/Address~Delete} */
exports.Delete = guard.ensure(['https', 'loggedIn'], Delete);
