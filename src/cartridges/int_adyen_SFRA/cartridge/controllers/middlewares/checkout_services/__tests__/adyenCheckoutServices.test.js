let req;
let res;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('isNotAdyen', () => {
   it('should return false if payment instrument is Adyen', () => {
       const { isNotAdyen } = jest.requireActual('../adyenCheckoutServices');
       const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
        expect(isNotAdyen(currentBasket)).toBeFalsy();
  });
    it('should return true if payment instrument is not Adyen', () => {
        const { isNotAdyen } = jest.requireActual('../adyenCheckoutServices');
        const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
        currentBasket.getPaymentInstruments().toArray.mockReturnValue([{paymentMethod: "mockedComponent"}]);
        expect(isNotAdyen(currentBasket)).toBeTruthy();
    });
});
