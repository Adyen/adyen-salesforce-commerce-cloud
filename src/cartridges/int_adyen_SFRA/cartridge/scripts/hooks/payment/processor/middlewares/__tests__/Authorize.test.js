/* eslint-disable global-require */
let Authorize;

beforeEach(() => {
    Authorize = require('../Authorize');
    jest.clearAllMocks();
});

afterEach(() => {
    jest.resetModules();
});

describe('adyen component Authorize function', () => {
    it('return with appropriate mesages when create payment request fails', () => {
        const BasketMgr = require('dw/order/BasketMgr');
        const currentBasket = BasketMgr.getCurrentBasket();
        const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        adyenCheckout.createPaymentRequest.mockImplementation(() => ({
            error: {}
        }));
        const authorizeResult = Authorize("15", currentBasket.createPaymentInstrument(), "mockedPaymentProcessor");
        expect(authorizeResult.authorized).toBe(false);
        expect(authorizeResult.error).toBe(true);
    });

    it('handle the create payment request result 3DS', () => {
        const BasketMgr = require('dw/order/BasketMgr');
        const currentBasket = BasketMgr.getCurrentBasket();
        const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        adyenCheckout.createPaymentRequest.mockImplementation(() => ({
            resultCode: "RedirectShopper",
            redirectObject: {
                data: {
                    MD: "mockedMD"
                }
            }
        }));
        const authorizeResult = Authorize("15", currentBasket.createPaymentInstrument(), "mockedPaymentProcessor");
        expect(authorizeResult.authorized).toBe(true);
        expect(authorizeResult.authorized3d).toBe(true);
        expect(authorizeResult.signature).toBeNull();

    });

    it('handle the create payment request result 3DS2', () => {
        const BasketMgr = require('dw/order/BasketMgr');
        const currentBasket = BasketMgr.getCurrentBasket();
        const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        adyenCheckout.createPaymentRequest.mockImplementation(() => ({
            threeDS2: "mockedthreeDS2",
            resultCode: "mockedresultCode",
            token3ds2: "mockedtoken3ds2",
        }));
        const authorizeResult = Authorize("15", currentBasket.createPaymentInstrument(), "mockedPaymentProcessor");
        expect(authorizeResult.threeDS2).toBe("mockedthreeDS2");
        expect(authorizeResult.resultCode).toBe("mockedresultCode");
        expect(authorizeResult.token3ds2).toBe("mockedtoken3ds2");
    });

    it('handle the create payment request result redirectShopper', () => {
        const BasketMgr = require('dw/order/BasketMgr');
        const currentBasket = BasketMgr.getCurrentBasket();
        const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        adyenCheckout.createPaymentRequest.mockImplementation(() => ({
            resultCode: "RedirectShopper",
            redirectObject: {
                url: "mockedURL",
            },
            paymentData: "mockedpaymentData"
        }));
        const authorizeResult = Authorize("15", currentBasket.createPaymentInstrument(), "mockedPaymentProcessor");
        expect(authorizeResult.authorized).toBe(true);
        expect(authorizeResult.authorized3d).toBe(false);
        expect(authorizeResult.signature).toBeTruthy();
    });

    it('handle the create payment request decision accept', () => {
        const BasketMgr = require('dw/order/BasketMgr');
        const currentBasket = BasketMgr.getCurrentBasket();
        const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        adyenCheckout.createPaymentRequest.mockImplementation(() => ({
            decision: "ACCEPT"
        }));
        const authorizeResult = Authorize("15", currentBasket.createPaymentInstrument(), "mockedPaymentProcessor");
        expect(authorizeResult.authorized).toBe(true);
        expect(authorizeResult.error).toBe(false);
    });

    it('handle create payment request decisions other than accept', () => {
        const BasketMgr = require('dw/order/BasketMgr');
        const currentBasket = BasketMgr.getCurrentBasket();
        const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        adyenCheckout.createPaymentRequest.mockImplementation(() => ({
            decision: "DON'T ACCEPT"
        }));
        const authorizeResult = Authorize("15", currentBasket.createPaymentInstrument(), "mockedPaymentProcessor");
        expect(authorizeResult.error).toBe(true);
    });
});