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
    const data = {
      data: { fullResponse: { action: 'mocked_action' } },
      paymentMethod: 'mocked_paymentMethod',
    };
    $.ajax = jest.fn(({ success }) => {
      success(data);
      return { fail: jest.fn() };
    });
    await paymentFromComponent(data, component);
    expect(component.handleAction).toBeCalledWith(data.fullResponse.action);
    expect(component.setStatus).toHaveBeenCalledTimes(0);
    expect(component.reject).toHaveBeenCalledTimes(0);
  });
  it('should make payment ajax call that fails', async () => {
    $.ajax = jest.fn(({ success }) => {
      success({});
      return { fail: jest.fn() };
    });
    await paymentFromComponent(
      { data: {}, paymentMethod: 'mocked_paymentMethod' },
      component,
    );
    expect(component.handleAction).toHaveBeenCalledTimes(0);
    expect(component.setStatus).toBeCalledWith('ready');
    expect(component.reject).toBeCalledWith('Payment Refused');
  });
});
