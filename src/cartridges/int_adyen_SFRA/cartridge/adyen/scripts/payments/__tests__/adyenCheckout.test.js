const adyenCheckout = require('../adyenCheckout');
const Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');

describe('AdyenCheckout', () => {
    it('should not error when cached gift card amount and actual amount match', () => {
        const args = {
            Order: {
                custom: {},
                setPaymentStatus: jest.fn(),
                setExportStatus: jest.fn(),
                getOrderNo: jest.fn(),
                getOrderToken: jest.fn(),
                getCustomerEmail: jest.fn(),
                paymentInstrument: {
                    custom: {
                        adyenPaymentData: "{}",
                        adyenPartialPaymentsOrder:
                          '{"orderData":"b4c0!BQABAgBzO7ZwfyxJ9ifN0NIgUsuwBdUWb==...",' +
                          '"remainingAmount":{"currency":"EUR","value":20799},' +
                          '"amount":{"currency":"EUR","value":1000}}'

                    },
                    paymentTransaction: {
                        amount: {
                            value: 1000,
                            currencyCode: "EUR"
                        }
                    }
                },
            },
        };

        expect(Logger.error.mock.calls.length).toBe(0);
    })

    it('should throw error when cached gift card amount and actual amount mismatch', () => {
        const args = {
            Order: {
                custom: {},
                setPaymentStatus: jest.fn(),
                setExportStatus: jest.fn(),
                getOrderNo: jest.fn(),
                getOrderToken: jest.fn(),
                getCustomerEmail: jest.fn(),
                paymentInstrument: {
                    custom: {
                        adyenPaymentData: "{}",
                        adyenPartialPaymentsOrder:
                          '{"orderData":"b4c0!BQABAgBzO7ZwfyxJ9ifN0NIgUsuwBdUWb==...",' +
                          '"remainingAmount":{"currency":"EUR","value":20799},' +
                          '"amount":{"currency":"EUR","value":25799}}'

                    },
                    paymentTransaction: {
                        amount: {
                            value: 1000,
                            currencyCode: "EUR"
                        }
                    }
                }
            }
        };

        const response =  adyenCheckout.createPaymentRequest(args);
        expect(Logger.error.mock.calls[0][0]).toContain("Cart has been edited after applying a gift card");
        expect(response.error).toEqual(true);

    })

    it('should throw error when cached gift card amount and actual amount mismatch', () => {
        const args = {
            Order: {
                custom: {},
                setPaymentStatus: jest.fn(),
                setExportStatus: jest.fn(),
                getOrderNo: jest.fn(),
                getOrderToken: jest.fn(),
                getCustomerEmail: jest.fn(),
                paymentInstrument: {
                    custom: {
                        adyenPaymentData: "{}",
                        adyenPartialPaymentsOrder:
                          '{"orderData":"b4c0!BQABAgBzO7ZwfyxJ9ifN0NIgUsuwBdUWb==...",' +
                          '"remainingAmount":{"currency":"USD","value":20799},' +
                          '"amount":{"currency":"USD","value":1000}}'

                    },
                    paymentTransaction: {
                        amount: {
                            value: 1100,
                            currencyCode: "EUR"
                        }
                    }
                }
            }
        };

        const response =  adyenCheckout.createPaymentRequest(args);
        expect(Logger.error.mock.calls[0][0]).toContain("Cart has been edited after applying a gift card");
        expect(response.error).toEqual(true);
    })
})
