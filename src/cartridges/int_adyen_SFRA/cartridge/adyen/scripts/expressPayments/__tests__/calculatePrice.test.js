/* eslint-disable global-require */

jest.mock('dw/catalog/ProductMgr');
jest.mock('*/cartridge/scripts/helpers/pricing');
jest.mock('*/cartridge/adyen/logs/adyenCustomLogs');

const ProductMgr = require('dw/catalog/ProductMgr');
const priceHelper = require('*/cartridge/scripts/helpers/pricing');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

const calculatePrice = require('../calculatePrice');

describe('calculatePrice', () => {
  let req;
  let res;
  let next;
  let mockProduct;
  let mockPriceModel;
  let mockPriceTable;
  let mockPrice;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      form: {
        pid: 'test-product-id',
        quantity: 2,
      },
    };

    res = {
      json: jest.fn(),
    };

    next = jest.fn();

    mockPrice = {
      value: 10.99,
      currencyCode: 'USD',
      multiply: jest.fn().mockReturnValue({
        value: 21.98,
        currencyCode: 'USD',
      }),
    };

    mockPriceTable = {
      quantities: [
        { getValue: () => 1 },
        { getValue: () => 5 },
        { getValue: () => 10 },
      ],
      getQuantities: jest.fn().mockReturnValue([
        { getValue: () => 1 },
        { getValue: () => 5 },
        { getValue: () => 10 },
      ]),
      getPrice: jest.fn().mockReturnValue(mockPrice),
    };

    mockPriceModel = {
      getPrice: jest.fn().mockReturnValue(mockPrice),
      getPriceTable: jest.fn().mockReturnValue(mockPriceTable),
    };

    mockProduct = {
      master: false,
      variationGroup: false,
      bundle: false,
      getPriceModel: jest.fn().mockReturnValue(mockPriceModel),
      variationModel: {
        variants: [],
      },
    };
    ProductMgr.getProduct = jest.fn().mockReturnValue(mockProduct);
    priceHelper.getPromotionPrice = jest.fn().mockReturnValue(null);
  });

  describe('validateProduct', () => {
    it('should return error when pid is missing', () => {
      req.form.pid = '';
      calculatePrice(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: true,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should return error when product is not found', () => {
      ProductMgr.getProduct.mockReturnValue(null);   
      calculatePrice(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: true,
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getProductForPricing', () => {
    it('should return original product when no variants', () => {
      calculatePrice(req, res, next);
      expect(mockProduct.getPriceModel).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalAmount: {
          value: 21.98,
          currencyCode: 'USD',
        },
      });
    });

    it('should select available variant when product has variants', () => {
      const mockVariant = {
        ...mockProduct,
        availabilityModel: { availability: 5 },
        getPriceModel: jest.fn().mockReturnValue(mockPriceModel),
      };
      mockProduct.master = true;
      mockProduct.variationModel.variants = [mockVariant];
      calculatePrice(req, res, next);
      expect(mockVariant.getPriceModel).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalAmount: {
          value: 21.98,
          currencyCode: 'USD',
        },
      });
    });

    it('should select first variant when no available variants', () => {
      const mockVariant = {
        ...mockProduct,
        availabilityModel: { availability: 0 },
        getPriceModel: jest.fn().mockReturnValue(mockPriceModel),
      };
      mockProduct.master = true;
      mockProduct.variationModel.variants = [mockVariant];
      calculatePrice(req, res, next);
      expect(mockVariant.getPriceModel).toHaveBeenCalled();
    });
  });

  describe('calculateProductPrice', () => {
    it('should use standard pricing when no tiered pricing', () => {
      mockPriceTable.quantities = [{ getValue: () => 1 }];
      mockPriceTable.getQuantities.mockReturnValue([{ getValue: () => 1 }]);
      calculatePrice(req, res, next);
      expect(mockPriceModel.getPrice).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalAmount: {
          value: 21.98,
          currencyCode: 'USD',
        },
      });
    });

    it('should use tiered pricing when multiple quantity tiers exist', () => {
      req.form.quantity = 7;
      const tierPrice = {
        value: 8.99,
        currencyCode: 'USD',
        multiply: jest.fn().mockReturnValue({
          value: 62.93,
          currencyCode: 'USD',
        }),
      };

      const expectedQuantityTier = { getValue: () => 5 };
      mockPriceTable.getQuantities.mockReturnValue([
        { getValue: () => 1 },
        expectedQuantityTier,
        { getValue: () => 10 },
      ]);
      mockPriceTable.getPrice.mockReturnValue(tierPrice);
      calculatePrice(req, res, next);
      expect(mockPriceTable.getPrice).toHaveBeenCalledWith(expectedQuantityTier);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalAmount: {
          value: 62.93,
          currencyCode: 'USD',
        },
      });
    });

    it('should fallback to standard pricing when no tier matches', () => {
      mockPriceTable.quantities = [{ getValue: () => 1 }];
      mockPriceTable.getQuantities.mockReturnValue([{ getValue: () => 1 }]);
      calculatePrice(req, res, next);
      expect(mockPriceModel.getPrice).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalAmount: {
          value: 21.98,
          currencyCode: 'USD',
        },
      });
    });
  });

  describe('getFinalUnitPrice', () => {
    it('should use promotional price when available and lower', () => {
      const promotionalPrice = {
        value: 7.99,
        currencyCode: 'USD',
        available: true,
        multiply: jest.fn().mockReturnValue({
          value: 15.98,
          currencyCode: 'USD',
        }),
      };
      priceHelper.getPromotionPrice.mockReturnValue(promotionalPrice);
      calculatePrice(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalAmount: {
          value: 15.98,
          currencyCode: 'USD',
        },
      });
    });

    it('should use base price when promotional price is not available', () => {
      const promotionalPrice = {
        value: 7.99,
        currencyCode: 'USD',
        available: false,
      };
      priceHelper.getPromotionPrice.mockReturnValue(promotionalPrice);
      calculatePrice(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalAmount: {
          value: 21.98,
          currencyCode: 'USD',
        },
      });
    });
  });

  describe('error handling', () => {
    it('should return error when price model is not available', () => {
      mockProduct.getPriceModel.mockReturnValue(null);
      calculatePrice(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: true,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should return error when price is not available', () => {
      mockPriceTable.quantities = [{ getValue: () => 1 }];
      mockPriceTable.getQuantities.mockReturnValue([{ getValue: () => 1 }]);
      mockPriceModel.getPrice.mockReturnValue(null);
      calculatePrice(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: true,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should handle exceptions and log errors', () => {
      const error = new Error('Test error');
      ProductMgr.getProduct.mockImplementation(() => {
        throw error;
      });
      calculatePrice(req, res, next);
      expect(AdyenLogs.error_log).toHaveBeenCalledWith(
        'An error occurred while calculating the product price',
        error,
      );
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: true,
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('quantity handling', () => {
    it('should default quantity to 1 when not provided', () => {
      delete req.form.quantity;
      calculatePrice(req, res, next);
      expect(mockPrice.multiply).toHaveBeenCalledWith(1);
    });
  });

  describe('bundle products', () => {
    it('should handle bundle products correctly', () => {
      mockProduct.bundle = true;

      calculatePrice(req, res, next);

      expect(mockProduct.getPriceModel).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalAmount: {
          value: 21.98,
          currencyCode: 'USD',
        },
      });
    });
  });
});
