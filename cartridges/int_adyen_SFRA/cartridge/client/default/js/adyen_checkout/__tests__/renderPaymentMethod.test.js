"use strict";

/**
 * @jest-environment jsdom
 */
var _require = require('../renderPaymentMethod'),
  renderPaymentMethod = _require.renderPaymentMethod;
var store = require('../../../../../store');
var mount;
describe('Render Payment Method', function () {
  beforeEach(function () {
    document.body.innerHTML = "\n      <ul id=\"paymentMethodsList\"></ul>\n    ";
    store.componentsObj = {
      mocked_id: {
        node: {
          mocked_node: {
            foo: 'bar'
          }
        }
      }
    };
    mount = jest.fn();
    store.checkout = {
      create: jest.fn(function () {
        return {
          mount: mount
        };
      })
    };
  });
  it('should render stored payment method with missing shopper information fields', function () {
    var paymentMethod = {
      id: 'mocked_id',
      brand: 'mocked_brand',
      name: 'mocked_name',
      lastFour: '1234'
    };
    renderPaymentMethod(paymentMethod, true, '/mocked_path/', 'mocked_description');
    expect(mount).toBeCalledTimes(1);
    expect(document.getElementById('paymentMethodsList')).toMatchSnapshot();
    expect(store.componentsObj).toMatchSnapshot();
  });
  it('should render payment method with shopper information fields', function () {
    document.body.innerHTML += "\n    <input id=\"shippingFirstNamedefault\" value=\"shippingFirstNamedefaultMock\" />\n      <input id=\"shippingLastNamedefault\" value=\"shippingLastNamedefaultMock\" />\n      <input id=\"shippingPhoneNumberdefault\" value=\"shippingPhoneNumberdefaultMock\" />\n      <input id=\"shippingAddressCitydefault\" value=\"shippingAddressCitydefaultMock\" />\n      <input id=\"shippingZipCodedefault\" value=\"shippingZipCodedefaultMock\" />\n      <input id=\"shippingCountrydefault\" value=\"shippingCountrydefaultMock\" />\n      <input id=\"shippingStatedefault\" value=\"shippingStatedefaultMock\" />\n      <input id=\"shippingAddressOnedefault\" value=\"shippingAddressOnedefaultMock\" />\n      <input id=\"shippingAddressTwodefault\" value=\"shippingAddressTwodefaultMock\" />\n            \n      <input id=\"billingAddressCity\" value=\"billingAddressCityMock\" />\n      <input id=\"billingZipCode\" value=\"billingZipCodeMock\" />\n      <input id=\"billingCountry\" value=\"billingCountryMock\" />\n      <input id=\"billingState\" value=\"billingStateMock\" />\n      <input id=\"billingAddressOne\" value=\"billingAddressOneMock\" />\n      <input id=\"billingAddressTwo\" value=\"billingAddressTwoMock\" />\n      \n      <span class=\"customer-summary-email\">test@user.com</span>\n    ";
    var paymentMethod = {
      type: 'scheme',
      name: 'mocked_name',
      lastFour: '1234'
    };
    renderPaymentMethod(paymentMethod, false, '/mocked_path/', 'mocked_description');
    expect(document.getElementById('paymentMethodsList')).toMatchSnapshot();
    expect(store.componentsObj).toMatchSnapshot();
    expect(store.checkout.create.mock.calls[0][1]).toEqual({
      data: {
        personalDetails: {
          firstName: 'shippingFirstNamedefaultMock',
          lastName: 'shippingLastNamedefaultMock',
          telephoneNumber: 'shippingPhoneNumberdefaultMock',
          shopperEmail: 'test@user.com'
        },
        firstName: 'shippingFirstNamedefaultMock',
        lastName: 'shippingLastNamedefaultMock',
        telephoneNumber: 'shippingPhoneNumberdefaultMock',
        shopperEmail: 'test@user.com'
      },
      visibility: {
        personalDetails: 'editable',
        billingAddress: 'hidden',
        deliveryAddress: 'hidden'
      }
    });
  });
  it('should handle input onChange for paypal', function () {
    document.body.innerHTML += "\n      <button value=\"submit-payment\"></button>\n      <div id=\"component_paypal\"></div>\n    ";
    var paymentMethod = {
      type: 'paypal',
      name: 'mocked_name',
      lastFour: '1234'
    };
    renderPaymentMethod(paymentMethod, false, '/mocked_path/', 'mocked_description');
    var input = document.getElementById('rb_paypal');
    input.onchange({
      target: {
        value: 'paypal'
      }
    });
    expect(document.querySelector('button[value="submit-payment"]').disabled).toBeTruthy();
    expect(store.selectedMethod).toBe('paypal');
  });
});