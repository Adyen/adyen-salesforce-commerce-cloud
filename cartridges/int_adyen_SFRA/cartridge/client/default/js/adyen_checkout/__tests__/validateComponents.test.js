"use strict";

var store = require('../../../../../store');

var _require = require('../validateComponents'),
    validateComponents = _require.validateComponents;

function inputAssert(input) {
  input.onchange();
  expect(input.classList.contains('adyen-checkout__input--error')).toBeTruthy();
  input.setAttribute('value', 'foo');
  input.onchange();
  expect(input.classList.contains('adyen-checkout__input--error')).toBeFalsy();
}

describe('Validate Components', function () {
  it('validates ach', function () {
    document.body.innerHTML = "\n      <div id=\"component_ach\">\n        <input id=\"input\" />\n      </div>\n      <input id=\"adyenStateData\" />\n    ";
    validateComponents();
    var input = document.getElementById('input');
    inputAssert(input);
  });
  it('validates date of birth input', function () {
    document.body.innerHTML = "\n      <input id=\"dateOfBirthInput\" />\n      <input id=\"adyenStateData\" />\n    ";
    validateComponents();
    var input = document.getElementById('dateOfBirthInput');
    inputAssert(input);
  });
  it('should handle ratepay', function () {
    document.body.innerHTML = "\n      <input id=\"genderInput\" value=\"example_gender\" />\n      <input id=\"dateOfBirthInput\" value=\"example_dob\" />\n      <input id=\"adyenStateData\" />\n    ";
    store.selectedMethod = 'ratepay';
    store.componentsObj = {
      ratepay: {
        stateData: {
          foo: 'bar'
        }
      }
    };
    validateComponents();
    expect(JSON.parse(document.getElementById('adyenStateData').value)).toMatchSnapshot();
  });
});