/**
 * @jest-environment jsdom
 */

const store = require('../../../../../store');
const {initializeCardComponent, submitAddCard} = require('../../adyenAccount')
$.fn.modal = jest.fn();

jest.mock('../../commons');
jest.mock('../../../../../store');
let checkout;
// Mocking external dependencies
jest.mock('../../../../../store', () => ({
  checkoutConfiguration: {
    amount: { value: 0, currency: 'EUR' },
    paymentMethodsConfiguration: {
      card: {
        onChange: jest.fn(),
      },
    },
    onAdditionalDetails: jest.fn(),
  },
}));   

describe('submitAddCard', () => {
  beforeEach(() => {
    store.checkoutConfiguration = {};
    
    jest.clearAllMocks();
  });

  it('initialize card component', async () => {
    document.body.innerHTML = `<div id="card"></div>`;
    await initializeCardComponent();
    expect(document.getElementById('card')).toBeDefined();
  });

  it('should send form data via ajax on submitAddCard call', () => {
    const fakeResponse = {redirectAction : 'test'};
    document.body.innerHTML = `<form id="payment-form" action="/fake-action">
      <input type="text" name="fake" value="fake" />
    </form>`;
    $.ajax = jest.fn(({ success }) => {
        success(fakeResponse);
        return { fail: jest.fn() };
      });
    submitAddCard();
    expect($.ajax).toHaveBeenCalledWith({
      type: 'POST',
      url: '/fake-action',
      data: 'fake=fake',
      async: false,
      success: expect.any(Function),
    });
  });

  it('should handle redirection action after successful form submission', () => {
    const fakeRedirectAction = { type: 'redirect' };
    document.body.innerHTML = `<form id="payment-form" action="/fake-action">
      <input type="text" name="fake" value="fake" />
    </form>`;
    $.ajax = jest.fn(({ success }) => {
      success({ redirectAction: fakeRedirectAction });
      return { fail: jest.fn() };
    });
    window.location.href = '';
    submitAddCard();
    expect(window.location.href).toBe('http://localhost/');
  }); 

  it('should handle errors returned from the server during form submission', () => {
    let formErrorsExist = false
    const fakeErrorResponse = { error: 'Something went wrong' };
    $.ajax = jest.fn(({ success }) => {
      success(fakeErrorResponse);
      return { fail: jest.fn() };
    });
    submitAddCard();
    setTimeout(() => {
        expect(formErrorsExist).toBeTruthy();
        done();
      }); // Timeout needed for completition of the test
  }); 

});

