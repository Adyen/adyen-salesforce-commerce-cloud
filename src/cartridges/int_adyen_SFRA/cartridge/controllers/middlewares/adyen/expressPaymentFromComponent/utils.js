// Set address details on SFCC address object based on addressDetails object
function setAddressDetails(address, addressDetails) {
  address.setAddress1(addressDetails.address1);
  address.setAddress2(addressDetails.address2);
  address.setCity(addressDetails.city);
  address.setCompanyName(addressDetails.companyName);
  address.setCountryCode(addressDetails.countryCode.value);
  address.setFirstName(addressDetails.firstName);
  address.setLastName(addressDetails.lastName);
  address.setPhone(addressDetails.phone);
  address.setPostalCode(addressDetails.postalCode);
  address.setPostBox(addressDetails.postBox);
  address.setSalutation(addressDetails.salutation);
  address.setSecondName(addressDetails.secondName);
  address.setStateCode(addressDetails.stateCode);
  address.setSuffix(addressDetails.suffix);
  address.setSuite(addressDetails.suite);
  address.setTitle(addressDetails.title);
}

module.exports = {
  setAddressDetails,
};
