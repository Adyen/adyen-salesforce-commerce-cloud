"use strict";

var _processForm = require("mockData/processForm");

/* eslint-disable global-require */
var processForm;
var req;
beforeEach(function () {
  processForm = require('../processForm');
  jest.clearAllMocks();
  req = {
    form: {
      adyenPaymentMethod: 'mockedPaymentMethod',
      adyenIssuerName: 'mocked_issuer_name',
      brandCode: 'scheme'
    },
    currentCustomer: {
      raw: {}
    }
  };
});
describe('processForm', function () {
  it('should return error when credit card validation fails', function () {
    var processFormOutput = processForm(req, (0, _processForm.getPaymentForm)(), {});
    expect(processFormOutput).toMatchSnapshot();
  });
  it('should return viewData', function () {
    req.form.storedPaymentUUID = 'mockedUUID';
    var processFormOutput = processForm(req, (0, _processForm.getPaymentForm)(), {});
    expect(processFormOutput).toMatchSnapshot();
  });
  it('should return viewData when authenticated and registered', function () {
    var paymentForm = (0, _processForm.getPaymentForm)();
    var uuid = 'mocked_id';
    var paymentInstrument = (0, _processForm.getPaymentInstrument)(uuid);
    paymentForm.creditCardFields.selectedCardID = {
      value: uuid
    };
    req.form.brandCode = 'not_scheme';
    req.form.securityCode = 'mocked_security_code';
    req.currentCustomer.wallet = {
      paymentInstruments: [paymentInstrument]
    };
    req.currentCustomer.raw = {
      authenticated: true,
      registered: true
    };
    var processFormResult = processForm(req, paymentForm, {});
    expect(processFormResult).toMatchSnapshot();
  });
});