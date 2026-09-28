const adyenCheckout = require('../adyenCheckout');
const Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const adyenLevelTwoThreeData = require('*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData');
const hooksHelper = require('*/cartridge/scripts/helpers/hooks');

describe('AdyenCheckout', () => {
    function createArgs({ currencyCode = 'EUR', ...orderOverrides } = {}) {
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
                            currencyCode,
                        }
                    }
                },
                ...orderOverrides,
            },
        };
    }

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

    describe('doPaymentsCall amount validation', () => {
        function createOrder() {
            return {
                custom: {},
                setPaymentStatus: jest.fn(),
                setExportStatus: jest.fn(),
            };
        }

        function createPaymentInstrument(adyenPartialPaymentsOrder) {
            return {
                custom: adyenPartialPaymentsOrder
                    ? { adyenPartialPaymentsOrder }
                    : {},
                paymentTransaction: {
                    custom: {},
                    amount: { value: 1000, currencyCode: 'EUR' },
                },
            };
        }

        const partialPaymentsOrder = JSON.stringify({
            order: { orderData: 'Ab02b4c0!BQABAgB', pspReference: 'mocked_psp' },
            remainingAmount: { currency: 'EUR', value: 20799 },
            amount: { currency: 'EUR', value: 25799 },
        });

        it('should accept the remaining amount stored on the payment instrument', () => {
            const paymentResponse = adyenCheckout.doPaymentsCall(
                createOrder(),
                createPaymentInstrument(partialPaymentsOrder),
                { amount: { currency: 'EUR', value: 20799 } },
            );

            expect(paymentResponse.decision).toBe('ACCEPT');
        });

        it('should throw when the request amount does not match the payment instrument', () => {
            const testFn = () =>
                adyenCheckout.doPaymentsCall(
                    createOrder(),
                    createPaymentInstrument(partialPaymentsOrder),
                    { amount: { currency: 'EUR', value: 25799 } },
                );

            expect(testFn).toThrow('Amounts dont match');
        });

        it('should fall back to the transaction amount without a partial payments order', () => {
            const paymentResponse = adyenCheckout.doPaymentsCall(
                createOrder(),
                createPaymentInstrument(),
                { amount: { currency: 'EUR', value: 1000 } },
            );

            expect(paymentResponse.decision).toBe('ACCEPT');

            const testFn = () =>
                adyenCheckout.doPaymentsCall(
                    createOrder(),
                    createPaymentInstrument(),
                    { amount: { currency: 'EUR', value: 2000 } },
                );

            expect(testFn).toThrow('Amounts dont match');
        });
    });

    describe('device fingerprint', () => {
        beforeEach(() => {
            session.privacy.adyenFingerprint = null;
            AdyenHelper.executeCall.mockClear();
        });

        afterEach(() => {
            session.privacy.adyenFingerprint = null;
            hooksHelper.mockImplementation(() => ({ error: false }));
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'scheme' },
            });
        });

        it('should pass the session fingerprint to the payment request', () => {
            session.privacy.adyenFingerprint = 'session-fingerprint';

            adyenCheckout.createPaymentRequest(createArgs());

            expect(AdyenHelper.executeCall).toHaveBeenCalledWith(
                'AdyenPayment',
                expect.objectContaining({
                    deviceFingerprint: 'session-fingerprint',
                }),
            );
        });

        it('should not set a fingerprint when the session value is empty', () => {
            adyenCheckout.createPaymentRequest(createArgs());

            expect(AdyenHelper.executeCall).toHaveBeenCalledWith(
                'AdyenPayment',
                expect.not.objectContaining({
                    deviceFingerprint: expect.anything(),
                }),
            );
        });

        it('should allow the pre-auth hook to override the session fingerprint', () => {
            session.privacy.adyenFingerprint = 'session-fingerprint';
            hooksHelper.mockImplementation((_hook, _method, paymentRequest) => {
                paymentRequest.deviceFingerprint = 'merchant-fingerprint';
                return { error: false };
            });

            adyenCheckout.createPaymentRequest(createArgs());

            expect(AdyenHelper.executeCall).toHaveBeenCalledWith(
                'AdyenPayment',
                expect.objectContaining({
                    deviceFingerprint: 'merchant-fingerprint',
                }),
            );
        });

        it('should not pass the generic fingerprint for Riverty', () => {
            session.privacy.adyenFingerprint = 'session-fingerprint';
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'riverty' },
            });

            adyenCheckout.createPaymentRequest(createArgs());

            expect(AdyenHelper.executeCall).toHaveBeenCalledWith(
                'AdyenPayment',
                expect.not.objectContaining({
                    deviceFingerprint: expect.anything(),
                }),
            );
        });
    });

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

    describe('Cash App tokenisation', () => {
        const shopperReference = 'mocked_shopper_reference';
        const ONE_TIME = {
            type: 'cashapp',
            grantId: 'mocked_grantId',
            customerId: 'mocked_customerId',
        };
        const ON_FILE = {
            type: 'cashapp',
            onFileGrantId: 'mocked_onFileGrantId',
            cashtag: '$mocked_cashtag',
            customerId: 'mocked_customerId',
        };
        const TOKENISING = {
            storePaymentMethod: true,
            recurringProcessingModel: 'CardOnFile',
        };

        function mockStateData(paymentMethod, extras = {}) {
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod,
                ...extras,
            });
        }

        function createCashAppArgs() {
            return createArgs({ currencyCode: 'USD' });
        }

        function getSentPaymentRequest() {
            return AdyenHelper.executeCall.mock.calls[0][1];
        }

        function withoutShopperReference() {
            AdyenHelper.createShopperObject.mockImplementation(
                (input) => input.paymentRequest,
            );
        }

        beforeEach(() => {
            AdyenHelper.executeCall.mockClear();
            AdyenConfigs.getAdyenTokenisationEnabled.mockReturnValue(true);
            AdyenHelper.createShopperObject.mockImplementation((input) => ({
                ...input.paymentRequest,
                shopperReference,
            }));
        });

        afterEach(() => {
            AdyenConfigs.getAdyenTokenisationEnabled.mockReturnValue(true);
            AdyenHelper.createShopperObject.mockImplementation(
                (input) => input.paymentRequest,
            );
            AdyenHelper.createAdyenRequestObject.mockReturnValue({
                paymentMethod: { type: 'scheme' },
            });
        });

        it.each([
            ['tokenisation is disabled', () => {
                AdyenConfigs.getAdyenTokenisationEnabled.mockReturnValue(false);
                mockStateData(ONE_TIME);
            }],
            ['tokenisation is disabled but the component asked to store', () => {
                AdyenConfigs.getAdyenTokenisationEnabled.mockReturnValue(false);
                mockStateData(ON_FILE, TOKENISING);
            }],
            ['the component only granted one-time details', () => {
                mockStateData(ONE_TIME);
            }],
            ['storage is requested without on-file details', () => {
                mockStateData(ONE_TIME, TOKENISING);
            }],
            ['the order has no shopper reference at all', () => {
                withoutShopperReference();
                mockStateData(ON_FILE, TOKENISING);
            }],
        ])('should send a one-time payment when %s', (_scenario, arrange) => {
            arrange();

            adyenCheckout.createPaymentRequest(createCashAppArgs());

            const paymentRequest = getSentPaymentRequest();
            expect(paymentRequest.paymentMethod.type).toEqual('cashapp');
            expect(paymentRequest.storePaymentMethod).toBeUndefined();
            expect(paymentRequest.recurringProcessingModel).toBeUndefined();
        });

        it('should keep the tokenisation contract when the component granted on-file details', () => {
            mockStateData(ON_FILE, TOKENISING);

            adyenCheckout.createPaymentRequest(createCashAppArgs());

            const paymentRequest = getSentPaymentRequest();
            expect(paymentRequest.paymentMethod).toEqual(ON_FILE);
            expect(paymentRequest.storePaymentMethod).toBe(true);
            expect(paymentRequest.recurringProcessingModel).toEqual('CardOnFile');
            expect(paymentRequest.shopperReference).toEqual(shopperReference);
        });

        it('should keep the one-time grant when falling back', () => {
            mockStateData(ONE_TIME, TOKENISING);

            adyenCheckout.createPaymentRequest(createCashAppArgs());

            expect(getSentPaymentRequest().paymentMethod).toEqual(ONE_TIME);
        });

        it('should leave a stored Cash App payment untouched', () => {
            mockStateData(
                { type: 'cashapp', storedPaymentMethodId: 'mocked_storedPaymentMethodId' },
                { recurringProcessingModel: 'CardOnFile', shopperInteraction: 'ContAuth' },
            );

            adyenCheckout.createPaymentRequest(createCashAppArgs());

            const paymentRequest = getSentPaymentRequest();
            expect(paymentRequest.paymentMethod.storedPaymentMethodId).toEqual(
                'mocked_storedPaymentMethodId',
            );
            expect(paymentRequest.storePaymentMethod).toBeUndefined();
            expect(paymentRequest.recurringProcessingModel).toEqual('CardOnFile');
            expect(paymentRequest.shopperInteraction).toEqual('ContAuth');
        });

        it('should still tokenise other payment methods', () => {
            mockStateData({ type: 'scheme' });

            adyenCheckout.createPaymentRequest(createCashAppArgs());

            const paymentRequest = getSentPaymentRequest();
            expect(paymentRequest.storePaymentMethod).toBe(true);
            expect(paymentRequest.recurringProcessingModel).toEqual('CardOnFile');
        });
    })
})
