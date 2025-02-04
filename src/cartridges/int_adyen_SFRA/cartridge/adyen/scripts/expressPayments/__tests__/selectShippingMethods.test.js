/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
const shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
const URLUtils = require('dw/web/URLUtils');
let req;
let res;
let next;
let currentBasket;
const callSelectShippingMethod = require('../selectShippingMethods');

describe('callSelectShippingMethod', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      form: {
        data: JSON.stringify({})
      }
    };

    res = {
      json: jest.fn(),
      setStatusCode: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  it('should handle the case when there is no current basket', () => {
    currentBasket = BasketMgr.getCurrentBasket.mockReturnValueOnce(null);
    callSelectShippingMethod(req, res, next);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      redirectUrl: URLUtils.url('Cart-Show').toString(),
    });
    expect(next).toHaveBeenCalled();
  });

  it('should handle the case when there is an error selecting the shipping method', () => {
    req.body = JSON.stringify({shipmentUUID: 'mocked_uuid'});
    currentBasket = {
      defaultShipment: {},
    };
    BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket.defaultShipment);
    shippingHelper.getShipmentByUUID.mockReturnValueOnce(currentBasket.defaultShipment);

    callSelectShippingMethod(req, res, next);

    expect(res.setStatusCode).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      errorMessage: 'mocked_error.cannot.select.shipping.method',
    });
    expect(next).toHaveBeenCalled();
  });

  it('should handle the case when there is no error', () => {
    const currentBasket = {
      defaultShipment: {
        shippingMethod: {
          description: 'Order received within 7-10 business days',
          displayName: 'Ground',
          ID: '001',
          custom: {
            estimatedArrivalTime: '7-10 Business Days',
          },
        },
      },
      getTotalGrossPrice: jest.fn(() => ({ value: 100, currencyCode: 'USD' })),
    };
    BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);
    shippingHelper.selectShippingMethod.mockImplementationOnce(() => {});

    const CartModel = require('*/cartridge/models/cart');
    const basketModelInstance = {
      someMethod: jest.fn(),
    };
    CartModel.mockReturnValueOnce(basketModelInstance);

    callSelectShippingMethod(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      ...basketModelInstance,
      grandTotalAmount: {
        value: 100,
        currency: 'USD',
      },
    });
    expect(next).toHaveBeenCalled();
  });
});