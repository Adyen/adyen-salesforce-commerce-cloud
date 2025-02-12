/**
 * @jest-environment jsdom
 */

const store = require('../../../../../store');
const {initializeCardComponent, handleAction, handleAddNewPayment} = require('../../adyenAccount')
$.fn.modal = jest.fn();

jest.mock('../../adyenAccount.js', () => ({
  handleAction: jest.fn()
}));
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

  it('should handle redirection action after successful form submission', async () => {
    const fakeRedirectAction = { type: 'redirect' };
    document.body.innerHTML = `<form id="payment-form" action="/fake-action">
      <input type="text" name="fake" value="fake" />
    </form>`;
    window.location.href = '';
    await handleAddNewPayment();
    expect(window.location.href).toBe('http://localhost/');
  });
});

