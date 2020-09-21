const store = require('../../../../../store');
const { validateComponents } = require('../validateComponents');

function inputAssert(input) {
  input.onchange();
  expect(input.classList.contains('adyen-checkout__input--error')).toBeTruthy();
  input.value = 'foo';
  input.onchange();
  expect(input.classList.contains('adyen-checkout__input--error')).toBeFalsy();
}

describe('Validate Components', () => {
  it('validates ach', () => {
    document.body.innerHTML = `
      <div id="component_ach">
        <input id="input" />
      </div>
      <input id="adyenStateData" />
    `;
    validateComponents();
    const input = document.getElementById('input');
    inputAssert(input);
  });

  it('validates date of birth input', () => {
    document.body.innerHTML = `
      <input id="dateOfBirthInput" />
      <input id="adyenStateData" />
    `;
    validateComponents();
    const input = document.getElementById('dateOfBirthInput');
    inputAssert(input);
  });

  it('should handle ach', () => {
    document.body.innerHTML = `
      <input id="bankAccountOwnerNameValue" value="example_owner" />
      <input id="bankAccountNumberValue" value="example_account" />
      <input id="bankLocationIdValue" value="example_location" />
      <input id="adyenStateData" />
    `;
    store.selectedMethod = 'ach';
    store.componentsObj = { ach: { stateData: { foo: 'bar' } } };
    validateComponents();
    expect(
      JSON.parse(document.getElementById('adyenStateData').value),
    ).toMatchSnapshot();
  });

  it('should handle ratepay', () => {
    document.body.innerHTML = `
      <input id="genderInput" value="example_gender" />
      <input id="dateOfBirthInput" value="example_dob" />
      <input id="adyenStateData" />
    `;
    store.selectedMethod = 'ratepay';
    store.componentsObj = { ratepay: { stateData: { foo: 'bar' } } };
    validateComponents();
    expect(
      JSON.parse(document.getElementById('adyenStateData').value),
    ).toMatchSnapshot();
  });
});
