"use strict";

var utils = require('../utils');
var addressDetails;
var address;
beforeEach(function () {
  jest.clearAllMocks();
  address = {
    setAddress1: jest.fn(),
    setAddress2: jest.fn(),
    setCity: jest.fn(),
    setCompanyName: jest.fn(),
    setCountryCode: jest.fn(),
    setFirstName: jest.fn(),
    setLastName: jest.fn(),
    setPhone: jest.fn(),
    setPostalCode: jest.fn(),
    setPostBox: jest.fn(),
    setSalutation: jest.fn(),
    setSecondName: jest.fn(),
    setStateCode: jest.fn(),
    setSuffix: jest.fn(),
    setSuite: jest.fn(),
    setTitle: jest.fn()
  };
  addressDetails = {
    address1: 'mockAddress1',
    address2: 'mockAddress2',
    city: 'mockCity',
    companyName: 'mockCompanyName',
    countryCode: {
      value: 'mockCountryCodeValue'
    },
    firstName: 'mockFirstName',
    lastName: 'mockLastName',
    phone: 'mockPhoneNumber',
    postalCode: 'mockPostalCode',
    postBox: 'mockPostBox',
    salutation: 'mockSalutation',
    secondName: 'mockSecondName',
    stateCode: 'mockStateCode',
    suffix: 'mockSuffix',
    suite: 'mockSuite',
    title: 'mockTitle'
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Utils', function () {
  it('should set addressDetails on address', function () {
    utils.setAddressDetails(address, addressDetails);
    expect(address.setAddress1.mock.calls.length).toBe(1);
    expect(address.setAddress1.mock.calls[0][0]).toBe(addressDetails.address1);
    expect(address.setAddress2.mock.calls.length).toBe(1);
    expect(address.setAddress2.mock.calls[0][0]).toBe(addressDetails.address2);
    expect(address.setCity.mock.calls.length).toBe(1);
    expect(address.setCity.mock.calls[0][0]).toBe(addressDetails.city);
    expect(address.setCompanyName.mock.calls.length).toBe(1);
    expect(address.setCompanyName.mock.calls[0][0]).toBe(addressDetails.companyName);
    expect(address.setCountryCode.mock.calls.length).toBe(1);
    expect(address.setCountryCode.mock.calls[0][0]).toBe(addressDetails.countryCode.value);
    expect(address.setFirstName.mock.calls.length).toBe(1);
    expect(address.setFirstName.mock.calls[0][0]).toBe(addressDetails.firstName);
    expect(address.setLastName.mock.calls.length).toBe(1);
    expect(address.setLastName.mock.calls[0][0]).toBe(addressDetails.lastName);
    expect(address.setPhone.mock.calls.length).toBe(1);
    expect(address.setPhone.mock.calls[0][0]).toBe(addressDetails.phone);
    expect(address.setPostalCode.mock.calls.length).toBe(1);
    expect(address.setPostalCode.mock.calls[0][0]).toBe(addressDetails.postalCode);
    expect(address.setPostBox.mock.calls.length).toBe(1);
    expect(address.setPostBox.mock.calls[0][0]).toBe(addressDetails.postBox);
    expect(address.setSalutation.mock.calls.length).toBe(1);
    expect(address.setSalutation.mock.calls[0][0]).toBe(addressDetails.salutation);
    expect(address.setSecondName.mock.calls.length).toBe(1);
    expect(address.setSecondName.mock.calls[0][0]).toBe(addressDetails.secondName);
    expect(address.setStateCode.mock.calls.length).toBe(1);
    expect(address.setStateCode.mock.calls[0][0]).toBe(addressDetails.stateCode);
    expect(address.setSuffix.mock.calls.length).toBe(1);
    expect(address.setSuffix.mock.calls[0][0]).toBe(addressDetails.suffix);
    expect(address.setSuite.mock.calls.length).toBe(1);
    expect(address.setSuite.mock.calls[0][0]).toBe(addressDetails.suite);
    expect(address.setTitle.mock.calls.length).toBe(1);
    expect(address.setTitle.mock.calls[0][0]).toBe(addressDetails.title);
  });
});