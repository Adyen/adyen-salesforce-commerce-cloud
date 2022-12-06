"use strict";

var _processForm = require("mockData/processForm");
/* eslint-disable global-require */
var processForm;
var req;
var adyenHelper;
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
  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
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
    var paymentInstrument = (0, _processForm.getPaymentInstruments)(uuid);
    paymentForm.creditCardFields.selectedCardID = {
      value: uuid
    };
    paymentForm.adyenPaymentFields.adyenStateData = {
      value: JSON.stringify({
        paymentMethod: {
          storedPaymentMethodId: 'mocked_id'
        }
      })
    };
    req.form.brandCode = 'not_scheme';
    req.form.securityCode = 'mocked_security_code';
    req.currentCustomer.raw = {
      authenticated: true,
      registered: true
    };
    adyenHelper.getCustomer.mockReturnValue({
      getProfile: function getProfile() {
        return {
          getWallet: function getWallet() {
            return {
              getPaymentInstruments: function getPaymentInstruments() {
                return paymentInstrument;
              }
            };
          }
        };
      }
    });
    var processFormResult = processForm(req, paymentForm, {});
    expect(processFormResult).toMatchSnapshot();
  });
});