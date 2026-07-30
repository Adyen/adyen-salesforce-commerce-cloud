const adyenCheckout = require('../adyenCheckout');
const Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const adyenLevelTwoThreeData = require('*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData');

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
        const testFn = () => {adyenCheckout.createPaymentRequest(args)};
        expect(testFn).toThrow("Cart has been edited after applying a gift card");

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
        const testFn = () => {adyenCheckout.createPaymentRequest(args)};
        expect(testFn).toThrow("Cart has been edited after applying a gift card");
    })

    describe('L2/3 Data filtering with L23_PAYMENT_METHODS', () => {
        let getLineItemsSpy;
        const l23MockData = {
            levelTwoThree: {
                customerReferenceNumber: 'cust-1',
                totalTaxAmount: 10,
                itemDetailLines: [
                    {
                        unitPrice: 50,
                        totalAmount: 100,
                        quantity: 2,
                        unitOfMeasure: 'EAC',
                    },
                ],
            },
        };

        function getSentPaymentRequest() {
            return AdyenHelper.createShopperObject.mock.calls[0][0].paymentRequest;
        }

        function createArgs() {
            return {
                Order: {
                    custom: {},
                    setPaymentStatus: jest.fn(),
                    setExportStatus: jest.fn(),
                    getOrderNo: jest.fn(),
                    getOrderToken: jest.fn(),
                    getCustomerEmail: jest.fn(),
                    getBillingAddress: jest.fn(),
                    getDefaultShipment: jest.fn(),
                    getProductLineItems: jest.fn(() => ({ toArray: () => [] })),
                    paymentInstrument: {
                        custom: {
                            adyenPaymentData: "{}",
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
        }

        beforeEach(() => {
            getLineItemsSpy = jest.spyOn(adyenLevelTwoThreeData, 'getLineItems')
                .mockReturnValue(l23MockData);
            AdyenConfigs.getAdyenLevel23DataEnabled.mockReturnValue(true);
            AdyenHelper.createShopperObject.mockClear();
        });

        afterEach(() => {
            getLineItemsSpy.mockRestore();
            AdyenConfigs.getAdyenLevel23DataEnabled.mockReturnValue(false);
            AdyenConfigs.getAdyenBasketFieldsEnabled.mockReturnValue(false);
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'scheme' },
            });
        });

        it('should add L2/3 data for scheme payment method', () => {
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'scheme' },
            });
            adyenCheckout.createPaymentRequest(createArgs());
            expect(getLineItemsSpy).toHaveBeenCalled();
        });

        it('should send L2/3 data as enhancedSchemeData, not in additionalData', () => {
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'scheme' },
            });
            adyenCheckout.createPaymentRequest(createArgs());
            const paymentRequest = getSentPaymentRequest();
            expect(paymentRequest.enhancedSchemeData).toEqual(l23MockData);
            expect(paymentRequest.additionalData).toBeUndefined();
        });

        it('should not add enhancedSchemeData when there are no itemDetailLines', () => {
            getLineItemsSpy.mockReturnValue({
                levelTwoThree: {
                    customerReferenceNumber: 'cust-1',
                    totalTaxAmount: 0,
                    itemDetailLines: [],
                },
            });
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'scheme' },
            });
            adyenCheckout.createPaymentRequest(createArgs());
            expect(getSentPaymentRequest().enhancedSchemeData).toBeUndefined();
        });

        it('should not add enhancedSchemeData when getLineItems returns null', () => {
            getLineItemsSpy.mockReturnValue(null);
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'scheme' },
            });
            adyenCheckout.createPaymentRequest(createArgs());
            expect(getSentPaymentRequest().enhancedSchemeData).toBeUndefined();
        });

        it('should keep enhancedSchemeData out of a populated additionalData', () => {
            AdyenConfigs.getAdyenBasketFieldsEnabled.mockReturnValue(true);
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'scheme' },
                additionalData: { 'openinvoicedata.numberOfLines': '1' },
            });

            adyenCheckout.createPaymentRequest(createArgs());

            const paymentRequest = getSentPaymentRequest();
            expect(paymentRequest.enhancedSchemeData).toEqual(l23MockData);
            expect(
                Object.keys(paymentRequest.additionalData).every(
                    (key) => key.indexOf('enhancedSchemeData') !== 0,
                ),
            ).toBe(true);
        });

        it('should add L2/3 data for applepay payment method', () => {
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'applepay' },
            });
            adyenCheckout.createPaymentRequest(createArgs());
            expect(getLineItemsSpy).toHaveBeenCalled();
        });

        it('should add L2/3 data for googlepay payment method', () => {
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'googlepay' },
            });
            adyenCheckout.createPaymentRequest(createArgs());
            expect(getLineItemsSpy).toHaveBeenCalled();
        });

        it('should not add L2/3 data for non-L23 payment method', () => {
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'ideal' },
            });
            adyenCheckout.createPaymentRequest(createArgs());
            expect(getLineItemsSpy).not.toHaveBeenCalled();
        });

        it('should not add L2/3 data when Level23Data is disabled', () => {
            AdyenConfigs.getAdyenLevel23DataEnabled.mockReturnValue(false);
            adyenCheckout.createPaymentRequest(createArgs());
            expect(getLineItemsSpy).not.toHaveBeenCalled();
        });
    })
})
