/**
 * Handles Pipeline call for assignEventAddresses
 *
 * @input ProductList : dw.customer.ProductList The product list representing the gift registry.
 * @input GiftRegistryForm : dw.web.FormGroup The form definition representing the gift registry.
 * @input Customer : dw.customer.Customer The current customer's addressbook.
 *
 */
function execute(pdict) {
    assignEventAddresses(pdict);
    return PIPELET_NEXT;
}

/**
 * This script assigns the addresses used for the gift registry event. There are two addresses:
 * the address to use before the event occurs and the address to use after the event occurs.
 * If necessary, new addresses are created.
 *
 * This script is using form object definitions and form value definitions defined in
 * in the giftregistry.xml form. To access objects defined in a form, you use a script
 * expression.
 *
 * @param {dw.system.PipelineDictionary} pdict
 *
 */
function assignEventAddresses(pdict) {
    var productList = pdict.ProductList;
    var giftRegistryForm = pdict.GiftRegistryForm;
    var customer = pdict.Customer;

    var afterAddressId;
    var beforeAddressId;
    var addressBook = customer.getProfile().getAddressBook();

    // check to see if the before event address was changed by the user
    var addressBeforeEvent = giftRegistryForm.eventaddress.addressBeforeEvent;
    var addressBeforeEventId = addressBeforeEvent.addressid.value;
    var hasChangedBeforeAddress = isAddressChanged(addressBeforeEvent, addressBook.getAddress(addressBeforeEventId));

    // if the before event address was changed add it to the address book
    if (hasChangedBeforeAddress) {
        beforeAddressId = determineAddressId(addressBeforeEvent, addressBook);
        if(beforeAddressId) {
            addAddress(addressBeforeEvent, addressBook, beforeAddressId);
        }
    }

    // set the before address event
    if (beforeAddressId) {
        productList.setShippingAddress(addressBook.getAddress(beforeAddressId));
    } else {
        productList.setShippingAddress(addressBook.getAddress(addressBeforeEventId));
    }

    // check to see if the after event address was changed by the user
    var addressAfterEvent = giftRegistryForm.eventaddress.addressAfterEvent;
    var addressAfterEventId = addressAfterEvent.addressid.value;
    var hasChangedAfterAddress = isAddressChanged(addressAfterEvent, addressBook.getAddress(addressAfterEventId));

    // if the after event address was changed add it to the address book
    if (hasChangedAfterAddress) {
        afterAddressId = determineAddressId(addressAfterEvent, addressBook);
        if (afterAddressId) {
            addAddress(addressAfterEvent, addressBook, afterAddressId);
        }
    }

    // set the after address event
    if (afterAddressId) {
        productList.setPostEventShippingAddress(addressBook.getAddress(afterAddressId));
    } else {
        productList.setPostEventShippingAddress(addressBook.getAddress(addressAfterEventId));
    }
}

/**
 * Add a new address to the address book.
 *
 * @param {dw.web.FormGroup} addressFields
 * @param {dw.customer.CustomerAddress} address
 *
 */
function determineAddressId(addressFields, addressBook) {
    var addressID;
    var candidateID;
    var counter = 0;
    var existingAddress;

    if (addressFields.addressid.value) {
        addressID = addressFields.addressid.value;
        if (addressBook.getAddress(addressID)) {
            addressID = addressFields.city.value;
        }
    } else {
        addressID = addressFields.city.value;
    }

    candidateID = addressID;

    while (!existingAddress) {
        existingAddress = addressBook.getAddress(candidateID);

        if (existingAddress) {
            // this ID is already taken, increment the counter
            // and try the next one
            if (isAddressChanged(addressFields, existingAddress)) {
                counter++;
                candidateID = addressFields.city.value + "-" + counter;
                existingAddress = null;
            } else {
                return null;
            }
        } else {
            return candidateID;
        }
    }
}

function addAddress(addressFields, addressBook, addressID) {
    var address;

    // create the new address and copy the form values
    address = addressBook.createAddress( addressID );
    address.setFirstName( addressFields.firstname.value );
    address.setLastName( addressFields.lastname.value );
    address.setAddress1( addressFields.address1.value );
    address.setAddress2( addressFields.address2.value );
    address.setCity( addressFields.city.value );
    address.setPostalCode( addressFields.postal.value );
    address.setStateCode( addressFields.states.state.value );
    address.setCountryCode( addressFields.country.value );
    address.setPhone( addressFields.phone.value );
}

/**
 * Compare a form address with an address from the address book.
 * Return true if they are different.
 *
 * @param {dw.web.FormGroup} addressFields
 * @param {dw.customer.CustomerAddress} address
 */
function isAddressChanged(addressFields, address) {

    if (address == null) return true;

    if ( addressFields.firstname.value != address.firstName ) {
        return true;
    }

    if ( addressFields.lastname.value != address.lastName ) {
        return true;
    }

    if ( addressFields.address1.value != address.address1 ) {
        return true;
    }

    if ( addressFields.address2.value != address.address2 ) {
        return true;
    }

    if ( addressFields.city.value != address.city ) {
        return true;
    }

    if ( addressFields.postal.value != address.postalCode ) {
        return true;
    }

    if ( addressFields.states.state.value != address.stateCode ) {
        return true;
    }

    if ( addressFields.country.value != address.countryCode) {
        return true;
    }

    if ( addressFields.phone.value != address.phone ) {
        return true;
    }

    return false;
}

module.exports = {
    execute: execute,
    assignEventAddresses: assignEventAddresses
};
