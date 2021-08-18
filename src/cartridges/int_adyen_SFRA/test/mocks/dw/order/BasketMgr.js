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
        countryCode: { value: 'us' },
        phone: '617-555-1234',
        stateCode: 'MA',

        setFirstName(firstNameInput) {
          this.firstName = firstNameInput;
        },
        setLastName(lastNameInput) {
          this.lastName = lastNameInput;
        },
        setAddress1(address1Input) {
          this.address1 = address1Input;
        },
        setAddress2(address2Input) {
          this.address2 = address2Input;
        },
        setCity(cityInput) {
          this.city = cityInput;
        },
        setPostalCode(postalCodeInput) {
          this.postalCode = postalCodeInput;
        },
        setStateCode(stateCodeInput) {
          this.stateCode = stateCodeInput;
        },
        setCountryCode(countryCodeInput) {
          this.countryCode.value = countryCodeInput;
        },
        setPhone(phoneInput) {
          this.phone = phoneInput;
        },
      },
    },
    totalGrossPrice: {
      value: 250.0,
    },

    paymentInstruments: {},
  };
}

module.exports = {
  getCurrentBasket,
};
