const { getPaymentForm, getPaymentInstruments } = require('mockData/processForm');

/* eslint-disable global-require */
let processForm;
let req;
let adyenHelper;

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
  adyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
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
    const paymentInstrument = getPaymentInstruments(uuid);
    paymentForm.creditCardFields.selectedCardID = { value: uuid };
    paymentForm.adyenPaymentFields.adyenStateData = {
      value: JSON.stringify({
        paymentMethod: {
          storedPaymentMethodId: 'mocked_id',
        }
      }),
    }
    req.form.brandCode = 'not_scheme';
    req.form.securityCode = 'mocked_security_code';
    req.currentCustomer.raw = { authenticated: true, registered: true };
    adyenHelper.getCustomer.mockReturnValue({
      getProfile: () => {
        return {
          getWallet: () => {
            return {
              getPaymentInstruments: () => paymentInstrument
            }
          }
        }
      }
    })
    const processFormResult = processForm(req, paymentForm, {});
    expect(processFormResult).toMatchSnapshot();
  });
});
