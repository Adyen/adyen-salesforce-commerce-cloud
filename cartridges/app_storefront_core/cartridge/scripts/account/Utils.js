/**
 * This script provides utility functions shared across other account
 * related scripts. Reused script components for account management
 * should be contained here, while this script is imported into the
 * requiring script.
 */

var Logger = require('dw/system/Logger');

/**
 * Determines a unique address ID for an address to be save the given
 * address book. The function first checks the city as the candidate ID
 * or appends a counter to the city (if already used as address ID) and
 * checks the existence of the resulting ID candidate. If the resulting
 * ID is unique this ID is returned, if not the counter is incremented and
 * checked again.
 *
 * @param {String} city
 * @param {dw.customer.AddressBook} addressBook
 * @returns {String}
 */
function determineUniqueAddressID (city, addressBook) {
    var counter = 0;
    var existingAddress = null;

    // check, if attribute "city" is set and has a value
    if (!city) {
        Logger.debug("Cannot determine unique address ID from non existing or not set attribute \"city\".");
        return;
    }

    // initialize the candidate ID
    var candidateID = city;

    while (existingAddress == null) {
        existingAddress = addressBook.getAddress(candidateID);

        if (existingAddress) {
            // this ID is already taken, increment the counter
            // and try the next one
            counter++;
            candidateID = city + "-" + counter;
            existingAddress = null;
        } else {
            return candidateID;
        }
    }
}

/**
 * Returns a possible equivalent address to the given order address from the
 * address book or null, if non equivalent address was found.
 *
 * @param {dw.customer.AddressBook} addressBook
 * @param {dw.order.OrderAddress} orderAddress
 * @returns {dw.customer.CustomerAddress}
 */
function getEquivalentAddress(addressBook, orderAddress) {
    var address;
    var addresses = addressBook.addresses;
    var iter = addresses.iterator();

    while (iter.hasNext()) {
        address = iter.next();
        if (address.isEquivalentAddress(orderAddress)) {
            return address;
        }
    }
}

module.exports = {
    determineUniqueAddressID: determineUniqueAddressID,
    getEquivalentAddress: getEquivalentAddress
};
