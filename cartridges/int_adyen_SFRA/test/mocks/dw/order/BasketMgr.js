"use strict";

function getCurrentBasket() {
  return {
    defaultShipment: {
      shippingAddress: {
        firstName: 'Amanda',
        lastName: 'Jones',
        address1: '65 May Lane',
        address2: '',
        city: 'Allston',
        postalCode: '02135',
        countryCode: {
          value: 'us'
        },
        phone: '617-555-1234',
        stateCode: 'MA',
        setFirstName: function setFirstName(firstNameInput) {
          this.firstName = firstNameInput;
        },
        setLastName: function setLastName(lastNameInput) {
          this.lastName = lastNameInput;
        },
        setAddress1: function setAddress1(address1Input) {
          this.address1 = address1Input;
        },
        setAddress2: function setAddress2(address2Input) {
          this.address2 = address2Input;
        },
        setCity: function setCity(cityInput) {
          this.city = cityInput;
        },
        setPostalCode: function setPostalCode(postalCodeInput) {
          this.postalCode = postalCodeInput;
        },
        setStateCode: function setStateCode(stateCodeInput) {
          this.stateCode = stateCodeInput;
        },
        setCountryCode: function setCountryCode(countryCodeInput) {
          this.countryCode.value = countryCodeInput;
        },
        setPhone: function setPhone(phoneInput) {
          this.phone = phoneInput;
        }
      }
    },
    totalGrossPrice: {
      value: 250.0
    },
    paymentInstruments: {}
  };
}
module.exports = {
  getCurrentBasket: getCurrentBasket
};