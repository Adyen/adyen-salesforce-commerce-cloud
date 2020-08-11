/* eslint-disable global-require */
let processForm;
let req;
let paymentForm;
let viewFormData;

beforeEach(() => {
  processForm = require('../processForm');
  jest.clearAllMocks();
  req = {
    form: {
      adyenPaymentMethod: 'mockedPaymentMethod',
      brandCode: 'scheme',
    },
  };

  paymentForm = {
    paymentMethod: {
      htmlValue: 'mockedPaymentMethod',
    },
    creditCardFields: {
      cardType: {
        value: 'mockedCardType',
      },
      cardNumber: {
        value: 'mockedCardNumber',
      },
      saveCard: {
        checked: true,
      },
    },
    adyenPaymentFields: {
      adyenFingerprint: {
        value:
          'ryEGX8eZpJ0030000000000000KZbIQj6kzs0089146776cVB94iKzBGQGbvPiVrHq5S16Goh5Mk004ivbSuYdG0R00000YVxEr00000cru9sAxTR5wwQsLYbcA8:40',
      },
      adyenStateData: 'mockedStateData',
    },
  };

  viewFormData = {};
});

afterEach(() => {
  jest.resetModules();
});

describe('processForm', () => {
  it('should return error when credit card validation fails', () => {
    const processFormOutput = processForm(req, paymentForm, viewFormData);
    expect(processFormOutput).toMatchSnapshot();
  });

  it('should return viewData', () => {
    req.form.storedPaymentUUID = 'mockedUUID';
    const processFormOutput = processForm(req, paymentForm, viewFormData);
    expect(processFormOutput).toMatchSnapshot();
  });
});
