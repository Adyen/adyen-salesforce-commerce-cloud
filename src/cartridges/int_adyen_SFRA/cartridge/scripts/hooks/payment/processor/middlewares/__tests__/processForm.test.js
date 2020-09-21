import { getPaymentForm, getPaymentInstrument } from 'mockData/processForm';

/* eslint-disable global-require */
let processForm;
let req;

beforeEach(() => {
  processForm = require('../processForm');
  jest.clearAllMocks();
  req = {
    form: {
      adyenPaymentMethod: 'mockedPaymentMethod',
      adyenIssuerName: 'mocked_issuer_name',
      brandCode: 'scheme',
    },
    currentCustomer: { raw: {} },
  };
});

describe('processForm', () => {
  it('should return error when credit card validation fails', () => {
    const processFormOutput = processForm(req, getPaymentForm(), {});
    expect(processFormOutput).toMatchSnapshot();
  });

  it('should return viewData', () => {
    req.form.storedPaymentUUID = 'mockedUUID';
    const processFormOutput = processForm(req, getPaymentForm(), {});
    expect(processFormOutput).toMatchSnapshot();
  });

  it('should return viewData when authenticated and registered', () => {
    const paymentForm = getPaymentForm();
    const uuid = 'mocked_id';
    const paymentInstrument = getPaymentInstrument(uuid);
    paymentForm.creditCardFields.selectedCardID = { value: uuid };
    req.form.brandCode = 'not_scheme';
    req.form.securityCode = 'mocked_security_code';
    req.currentCustomer.wallet = {
      paymentInstruments: [paymentInstrument],
    };
    req.currentCustomer.raw = { authenticated: true, registered: true };
    const processFormResult = processForm(req, paymentForm, {});
    expect(processFormResult).toMatchSnapshot();
  });
});
