/**
 * @jest-environment jsdom
 */
const { paymentFromComponent } = require('../helpers');

let component;
beforeEach(() => {
  component = {
    handleAction: jest.fn(),
    setStatus: jest.fn(),
    reject: jest.fn(),
  };
});

describe('Helpers', () => {
  it('should make payment ajax call with fullResponse', async () => {
    document.body.innerHTML = `
        <div id="adyenPaymentMethodName"></div>
        <form id="showConfirmationForm"></form>
      `;
    const data = {
      fullResponse: { action: 'mocked_action' },
      paymentMethod: 'mocked_paymentMethod',
    };
    $.ajax = jest.fn(({ success }) => {
      success(data);
      return { fail: jest.fn() };
    });
    await paymentFromComponent(data, component);
    expect(component.handleAction).toBeCalledWith(data.fullResponse.action);
  });

  it('  should make payment ajax call that fails', async () => {
    document.body.innerHTML = `
        <div id="adyenPaymentMethodName"></div>
        <form id="showConfirmationForm"></form>
      `;
    window.HTMLFormElement.prototype.submit = jest.fn();
    const data = { data: {}, paymentMethod: 'mocked_paymentMethod' };
    $.ajax = jest.fn(({ success }) => {
      success({});
      return { fail: jest.fn() };
    });
    await paymentFromComponent(data, component);
    expect(data).toMatchSnapshot();
  });
});
