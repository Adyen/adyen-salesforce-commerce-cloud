/**
 * @jest-environment jsdom
 */

const store = require('../../../../../../config/store');

const {initializeCardComponent, handleAddNewPayment} = require('../adyenAccount')
$.fn.modal = jest.fn();

jest.mock('../adyenAccount.js', () => ({
  handleAction: jest.fn()
}));
jest.mock('../../../commons');
jest.mock('../../../../../../config/store');
// Mocking external dependencies
jest.mock('../../../../../../config/store', () => ({
  checkoutConfiguration: {
    amount: { value: 0, currency: 'EUR' },
    onAdditionalDetails: jest.fn(),
  },
  paymentMethodsConfiguration: {
    scheme: {
      onChange: jest.fn(),
    },
  },
}));   

describe('submitAddCard', () => {
  beforeEach(() => {
    store.checkoutConfiguration = {};
    
    jest.clearAllMocks();
  });

  it('initialize card component', async () => {
    document.body.innerHTML = `<div id="card"></div>`;
    const mount = jest.fn();
    window.AdyenWeb = {
      createComponent: jest.fn(() => ({ mount })),
      AdyenCheckout: jest.fn(),
    }
    $.ajax = jest.fn().mockReturnValue({
      AdyenPaymentMethods: {
        paymentMethods: [{ type: 'scheme', brands: ['mc', 'visa'] }]
      }
    });
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

