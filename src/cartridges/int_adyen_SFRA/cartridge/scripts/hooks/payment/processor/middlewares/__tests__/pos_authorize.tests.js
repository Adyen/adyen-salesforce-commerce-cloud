/* eslint-disable global-require */
let pos_authorize;
let orderNumber;
let paymentInstrument;
let paymentProcessor;
let Logger;

beforeEach(() => {
    pos_authorize = require('../pos_authorize');
    orderNumber = 'mockedNum';
    paymentInstrument = {
        paymentTransaction: {}
    };
    paymentProcessor= 'mockedPaymentProcessor';
    Logger = require('dw/system/Logger');
    jest.clearAllMocks();
});

afterEach(() => {
    jest.resetModules();
});

describe('pos_authorize', () => {
    it('should return error if there is no terminal ID', () => {
        const {
            getForm
        } = require('server').forms;
        getForm.mockImplementation(() => ({
            adyenPaymentFields: {
                terminalId: {value: null}
            }
        }));

        const authorizeResult = pos_authorize(orderNumber, paymentInstrument, paymentProcessor);
        expect(authorizeResult).toMatchSnapshot();
        expect(Logger.error.mock.calls).toMatchSnapshot();
    });

    it('should return error if createTerminalPayment fails', () => {
        const {
            createTerminalPayment
        } = require('*/cartridge/scripts/adyenTerminalApi');
        createTerminalPayment.mockImplementation(() => ({
            error: true,
            response: 'mockedResponse'
        }));

        const authorizeResult = pos_authorize(orderNumber, paymentInstrument, paymentProcessor);
        expect(authorizeResult).toMatchSnapshot();
        expect(Logger.error.mock.calls).toMatchSnapshot();
    });

    it('should return success response when createTerminalPayment passes', () => {
        const authorizeResult = pos_authorize(orderNumber, paymentInstrument, paymentProcessor);
        expect(authorizeResult).toMatchSnapshot();
    });
});
