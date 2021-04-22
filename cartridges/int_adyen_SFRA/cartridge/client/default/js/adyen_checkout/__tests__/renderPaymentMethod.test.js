"use strict";

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
  it('should render stored payment method', function () {
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
  it('should render payment method', function () {
    var paymentMethod = {
      type: 'scheme',
      name: 'mocked_name',
      lastFour: '1234'
    };
    renderPaymentMethod(paymentMethod, false, '/mocked_path/', 'mocked_description');
    expect(document.getElementById('paymentMethodsList')).toMatchSnapshot();
    expect(store.componentsObj).toMatchSnapshot();
  });
  it('should render fallback ratepay payment method', function () {
    var paymentMethod = {
      type: 'ratepay',
      name: 'mocked_name',
      lastFour: '1234'
    };
    renderPaymentMethod(paymentMethod, false, '/mocked_path/', 'mocked_description');
    expect(mount).toBeCalledTimes(0);
    expect(document.getElementById('paymentMethodsList')).toMatchSnapshot();
  });
  it('should handle input onChange', function () {
    document.body.innerHTML += "\n      <button value=\"submit-payment\"></button>\n      <div id=\"component_ratepay\"></div>\n    ";
    var paymentMethod = {
      type: 'ratepay',
      name: 'mocked_name',
      lastFour: '1234'
    };
    renderPaymentMethod(paymentMethod, false, '/mocked_path/', 'mocked_description');
    var input = document.getElementById('rb_ratepay');
    input.onchange({
      target: {
        value: 'ratepay'
      }
    });
    expect(document.querySelector('button[value="submit-payment"]').disabled).toBeFalsy();
    expect(store.selectedMethod).toBe('ratepay');
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