'use strict';

/**
 * Model for address functionality.
 * @module models/AddressModel
 */

/* API Includes */
var AbstractModel = require('./AbstractModel');
var ProductListMgr = require('dw/customer/ProductListMgr');
var Transaction = require('dw/system/Transaction');
var Form = require('~/cartridge/scripts/models/FormModel');
/**
 * Address helper providing enhanced address functionality.
 * @class module:models/AddressModel~AddressModel
 * @extends module:models/AbstractModel
 */
var AddressModel = AbstractModel.extend({
    /**
     * Removes the address.
     * Note that the deletion will fail in case the address is still associated with a product list
     *
     * @transactional
     * @alias module:models/AddressModel~AddressModel/remove
     * @return {Boolean} true if the address was successfully deleted, false otherwise.
     */
    remove: function () {
        var addressBook = customer.profile.addressBook;
        var address = this.object;
        if (!address) {
            return false;
        }

        /** @type {dw.campaign.ABTestMgr} */
        var listsWithAddress = ProductListMgr.getProductLists(address);
        if (!listsWithAddress.empty) {
            return false;
        }
        Transaction.wrap(function () {
            addressBook.removeAddress(address);
        });

        return true;
    }

});

/**
 * Gets a new instance for a given address or address ID.
 *
 * @alias module:models/AddressModel~AddressModel/get
 * @param parameter {dw.order.OrderAddress|dw.customer.CustomerAddress|String} The address object to enhance/wrap or an address ID.
 * @returns {module:models/AddressModel~AddressModel} If passed an address object object, returns the address object.
 * If passed a string, uses the string as the address ID to get the string.
 */
AddressModel.get = function (parameter) {
    var obj = null;
    if (typeof parameter === 'string') {
        obj = customer.addressBook.getAddress(parameter);
    } else if (typeof parameter === 'object') {
        obj = parameter;
    }
    return new AddressModel(obj);
};

/**
 * Creates a new address.
 *
 * @transactional
 * @alias module:models/AddressModel~AddressModel/create
 * @param {dw.web.FormGroup} [addressForm] The form which is used to update the address
 * @returns {module:models/AddressModel~AddressModel} The created address.
 */
AddressModel.create = function (addressForm) {
    var addressBook = customer.profile.addressBook;

    return Transaction.wrap(function () {
        var address = addressBook.createAddress(addressForm.addressid.value);

        if (addressForm) {
            if (!Form.get(addressForm).copyTo(address)) {
                return null;
            }

            if ('states' in addressForm) {
                if (!Form.get(addressForm.states).copyTo(address)) {
                    return null;
                }
            }
        }
        return new AddressModel(address);
    });
};

/**
 * Updates an existing address using the given form group.
 *
 * @transactional
 * @alias module:models/AddressModel~AddressModel/update
 * @param {String} address ID used to get an address.
 * @param {dw.web.FormGroup} [addressForm] The form that is used to update the address.
 * @returns {module:models/AddressModel~AddressModel | null} The updated address or null if
 * the address cannot be saved to the associated Salesforce Commerce Cloud system object.
 */
AddressModel.update = function (addressId, addressForm) {
    // Gets address to be edited.
    var addressBook = customer.profile.addressBook;
    var address = addressBook.getAddress(addressId);

    if (!address) {
        throw new Error('No address found');
    }

    if (address.ID !== addressForm.addressid.value) {
        for (var i = 0; i < addressBook.addresses.length; i++) {
            if (addressBook.addresses[i].ID === addressForm.addressid.value) {
                addressForm.addressid.invalidateFormElement();
                throw new Error('Address name already exists');
            }
        }
    }

    return Transaction.wrap(function () {
        if (addressForm) {
            if (!Form.get(addressForm).copyTo(address)) {
                addressForm.invalidateFormElement();
                throw new Error('Unable to update new address');
            }

            if ('states' in addressForm) {
                if (!Form.get(addressForm.states).copyTo(address)) {
                    addressForm.invalidateFormElement();
                    throw new Error('Unable to update address state');
                }
            }
        }

        return new AddressModel(address);
    });
};

/**
 * Removes the address for the given address ID.
 * <b>Note:</b> the deletion fails if the address is still associated with a product list.
 *
 * @transactional
 * @alias module:models/AddressModel~AddressModel/remove
 * @param {String} addressId The ID of the address to delete
 * @return {Boolean} true if the address was successfully deleted, false otherwise
 * @see module:models/AddressModel~AddressModel#remove
 */
AddressModel.remove = function (addressId) {
    return AddressModel.get(addressId).remove();
};

/** The order class */
module.exports = AddressModel;
