'use strict';

/**
 * Model for transient address information.
 * @module models/TransientAddressModel */
var Class = require('~/cartridge/scripts/util/Class').Class;
var CustomerAddress = require('dw/customer/CustomerAddress');

/*
 * All system address fields
 * @type {Array}
 */
var ADDRESS_FIELDS = require('~/cartridge/scripts/config').address.fields;

/*
 * Internal helper to copy all address fields from "from" to "to".
 * @param  {Object} from The object providing the address fields to copy.
 * @param  {Object} to   The object the fields are copied to.
 */
function copyFields(from, to) {
    // Copies system fields.
    ADDRESS_FIELDS.forEach(function (fieldName) {
        to[fieldName] = from[fieldName];
    });
    // Copies custom fields.
    if ('custom' in from && 'custom' in to) {
        for (var i in from.custom) {
            to.custom[i] = from.custom[i];
        }
    }
}

/**
 * Transient representation of an address.
 *
 * @class module:models/TransientAddressModel~TransientAddressModel
 * @extends module:util/Class
 */
var TransientAddressModel = Class.extend({
    UUID: null,
    ID: null,
    firstName: null,
    lastName: null,
    address1: null,
    address2: null,
    city: null,
    postalCode: null,
    stateCode: null,
    countryCode: null,
    phone: null,
    custom: {},

    /**
     * The UUID of the reference address. It is set when the attributes
     * are copied from a given customer or order address and is used
     * to preselect addresses on a per product line item base.
     */
    referenceAddressUUID: null,

    /**
     * Copies the attributes of this address to the given order address.
     */
    copyTo: function (toAddress) {
        copyFields(this, toAddress);
    },

    /**
     * Copies the attributes of a store's address to the given order address.
     */
    storeAddressTo: function (toAddress, storeObject) {
        toAddress.setFirstName('');
        toAddress.setLastName(storeObject.name);
        toAddress.setAddress1(storeObject.address1);
        toAddress.setAddress2(storeObject.address2);
        toAddress.setCity(storeObject.city);
        toAddress.setPostalCode(storeObject.postalCode);
        toAddress.setStateCode(storeObject.stateCode);
        toAddress.setCountryCode(storeObject.custom.countryCodeValue);
        toAddress.setPhone(storeObject.phone);
    },

    /**
     * Copies the attributes from the given customer address or
     * order address to this address. The function supports both
     * copying from CustomerAddress and from OrderAddress.
     */
    copyFrom: function (fromAddress) {
        // Sets the address ID if copying from a customer address.
        if (fromAddress instanceof CustomerAddress) {
            this.ID = fromAddress.ID;
        }

        copyFields(fromAddress, this);

        if (fromAddress.countryCode.value !== null && typeof fromAddress.countryCode.value !== 'undefined') {
            this.countryCode = fromAddress.countryCode.value;
        } else {
            this.countryCode = fromAddress.countryCode;
        }

        // Sets the address ID and UUID, if copying from a customer address.
        if (('ID' in fromAddress) && (fromAddress instanceof CustomerAddress || (fromAddress.ID !== null && fromAddress.UUID !== null))) {
            this.ID = fromAddress.ID;
            this.referenceAddressUUID = fromAddress.UUID;
        }

        if ('referenceAddressUUID' in fromAddress && fromAddress.referenceAddressUUID !== null) {
            this.referenceAddressUUID = fromAddress.referenceAddressUUID;
        }
    },

    /**
     * Checks if the address already exists in an array of addresses
     * for multishipping checkout.
     */
    addressExists: function (addresses) {

        for (var i = 0; i < addresses.length; i++) {
            var address = addresses[i];
            if (this.referenceAddressUUID !== null && (address.referenceAddressUUID !== null)) {
                if (this.referenceAddressUUID.equals(address.referenceAddressUUID)) {
                    return true;
                }
            } else {
                if (this.equals(address)) {
                    return true;
                }
            }
        }
    },

    /**
     * Returns true if the relevant fields of the addresses are all equal.
     * @param  {Object} address - The address to compare the transient address to
     * @return {boolean} true if both addresses are equal, false otherwise.
     */
    equals: function (address) {
        var that = this;
        return ADDRESS_FIELDS.every(function (fieldName) {
            return that[fieldName] === address[fieldName];
        });
    }
});

/** The TransientAddress class */
module.exports = TransientAddressModel;
