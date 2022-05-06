'use strict';
/**
 * Model for customer profiles.
 * @module models/ProfileModel */

/* API Includes */
var AbstractModel = require('./AbstractModel');
var Transaction = require('dw/system/Transaction');
var paymentHelpers = require('~/cartridge/scripts/payment/common');

/**
 * Profile helper providing enhanced profile functionality
 * @class module:models/ProfileModel~ProfileModel
 */
var ProfileModel = AbstractModel.extend(
    /** @lends module:models/ProfileModel~ProfileModel.prototype */
    {
        /**
         * Retrieves the preferred customer address.
         *
         * @alias module:models/ProfileModel~ProfileModel/getPreferredAddress
         * @return {dw.customer.CustomerAddress} Address defined as the preferred address in the profile.
         */
        getPreferredAddress: function () {
            return this.object.getAddressBook().getPreferredAddress();
        },

        /**
         * Retrieves the default customer shipping address.
         * @alias module:models/ProfileModel~ProfileModel/getDefaultShippingAddress
         * @return {dw.customer.CustomerAddress} Address defined as the preferred address in the profile.
         */
        getDefaultShippingAddress: function () {
            return this.getPreferredAddress();
        },

        /**
         * Retrieves the default customer billing address.
         * @alias module:models/ProfileModel~ProfileModel/getDefaultBillingAddress
         * @return {dw.customer.CustomerAddress} Address defined as the preferred address in the profile.
         */
        getDefaultBillingAddress: function () {
            return this.getPreferredAddress;
        },

        /**
         * Sets the default customer shipping address.
         *
         * @alias module:models/ProfileModel~ProfileModel/setDefaultShippingAddress
         * @param {CustomerAddress} address  new preferred address to be set.
         */
        setDefaultShippingAddress: function (address) {
            if (this.object instanceof dw.customer.Profile && this.object.addressBook) {
                this.object.addressBook.setPreferredAddress(address);
            }
        },

        /**
         * Sets the default customer billing address.
         *
         * @alias module:models/ProfileModel~ProfileModel/setDefaultBillingAddress
         * @param {dw.customer.CustomerAddress} address new default billing address.
         */
        setDefaultBillingAddress: function (address) {
            if (this.object instanceof dw.customer.Profile && this.object.addressBook) {
                this.object.addressBook.setPreferredAddress(address);
            }
        },

        /**
         * Checks if address is the default shipping address.
         *
         * @alias module:models/ProfileModel~ProfileModel/isDefaultShippingAddress
         * @param {dw.customer.CustomerAddress} address address to check
         * @return {Boolean} true if the address is the default shipping address.
         */
        isDefaultShippingAddress: function (address) {
            var defaultShippingAddress = this.getDefaultShippingAddress();
            return defaultShippingAddress && address && defaultShippingAddress.ID === address.ID;
        },

        /**
         * Checks if the address is the default billing address.
         *
         * @alias module:models/ProfileModel~ProfileModel/isDefaultBillingAddress
         * @param {CustomerAddress} address address to check
         * @return {Boolean} true if the address is the default billing address.
         */
        isDefaultBillingAddress: function (address) {
            var defaultBillingAddress = this.getDefaultBillingAddress();
            return defaultBillingAddress && address && defaultBillingAddress.ID === address.ID;
        },

        /**
         * Adds the given address to the address book of the current profile. The address
         * attribute "city" is used to generate the address ID within the address book.
         *
         * @transactional
         * @alias module:models/ProfileModel~ProfileModel/addAddressToAddressBook
         * @param {Object }addressToAdd Address with following attributes:
         * <ul><li> address1 </li>
         * <li> address2 </li>
         * <li> city </li>
         * <li> companyName </li>
         * <li> countryCode </li>
         * <li> firstName </li>
         * <li> lastName </li>
         * <li> postalCode </li>
         * <li> postBox </li>
         * <li> stateCode </li></ul>
         * <b>Note:</b> dw.customer.CustomerAddress objects can be passed and meet this criteria.
         * @returns {dw.customer.CustomerAddress} Address object that is added to the address book.
         */
        addAddressToAddressBook: function (addressToAdd) {
            var addressBook = this.getAddressBook();
            // Gets a possible equivalent address from the address book
            var that = this;

            return Transaction.wrap(function () {
                var address;
                if (addressToAdd) {
                    var usedAddress;
                    //Checks if the address already exists in the address book
                    for (var i = 0; i < addressBook.addresses.length; i++) {
                        usedAddress = addressBook.addresses[i];
                        if (usedAddress.isEquivalentAddress(addressToAdd)) {
                            address = usedAddress;
                            break;
                        }
                    }

                    // Creates the new address and copies the address attributes.
                    if (!address) {
                        // Gets a unique address ID.
                        var addressID = that.determineUniqueAddressID(addressToAdd.city);

                        // Checks on empty address ID.
                        if (!addressID) {
                            dw.system.Logger.debug('Cannot add address to address book, with empty address ID.');
                            return;
                        } else {
                            address = addressBook.createAddress(addressID);
                            address.setFirstName(addressToAdd.firstName);
                            address.setLastName(addressToAdd.lastName);
                            address.setAddress1(addressToAdd.address1);
                            address.setAddress2(addressToAdd.address2);
                            address.setCity(addressToAdd.city);
                            address.setPostalCode(addressToAdd.postalCode);
                            address.setStateCode(addressToAdd.stateCode);
                            address.setCountryCode(addressToAdd.countryCode.value);
                        }
                    }

                    // Updates the phone in either the equivalent found address
                    // or in the newly created address.
                    address.setPhone(addressToAdd.phone);
                }
                return address;
            });
        },

        /**
         * Determines a unique address ID for an address to be saved in the profiles address book. The function first
         * checks the city as the candidate ID or appends a counter to the city (if already used as address ID) and then
         * checks the existence of the resulting ID candidate. If the resulting ID is unique this ID is returned, if not
         * the counter is incremented and checked again.
         *
         * @param {String} city an address ID. Preferably the city used in the address. Must not be null.
         * @alias module:models/ProfileModel~ProfileModel/determineUniqueAddressID
         * @returns {String | null} Returns a unique address ID. If the city parameter is null, returns null.
         */
        determineUniqueAddressID: function (city) {
            var accountUtils = require('app_storefront_core/cartridge/scripts/account/Utils');
            return accountUtils.determineUniqueAddressID(city, this.getAddressBook());
        },

        /**
         * Validates payment instruments and returns valid payment instruments.
         *
         * @alias module:models/ProfileModel~ProfileModel/validateWalletPaymentInstruments
         * @param {String} countryCode Billing country code or null.
         * @param {Number} amount Payment amount to check valid payment instruments for.
         * @returns {ArrayList} Returns an array with the valid PaymentInstruments.
         */
        validateWalletPaymentInstruments: function (countryCode, amount) {
            return paymentHelpers.validatePaymentInstruments(this.getWallet(), countryCode, amount);
        }

    });

/**
 * Gets a new instance of a profile.
 * @alias module:models/ProfileModel~ProfileModel/get
 * @param {String | Object } parameter Customer number of the profile to get if a string or
 * the profile object to wrap with a ProfileModel if an object.
 */
ProfileModel.get = function (parameter) {
    var obj = null;
    if (typeof parameter === 'string') {
        obj = dw.customer.CustomerMgr.getProfile(parameter);
    } else if (typeof parameter === 'object') {
        obj = parameter;
    } else {
        obj = customer.profile;
    }
    return new ProfileModel(obj);
};


/** The profile class */
module.exports = ProfileModel;
