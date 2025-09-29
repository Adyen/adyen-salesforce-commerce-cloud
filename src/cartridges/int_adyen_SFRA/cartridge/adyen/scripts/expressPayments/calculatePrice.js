const ProductMgr = require('dw/catalog/ProductMgr');
const Resource = require('dw/web/Resource');
const priceHelper = require('*/cartridge/scripts/helpers/pricing');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');
const { AdyenError } = require('*/cartridge/adyen/logs/adyenError');

/**
 * Validate product exists and is available
 */
function validateProduct(pid) {
  if (!pid) {
    return { error: true };
  }

  const product = ProductMgr.getProduct(pid);
  if (!product) {
    return { error: true };
  }

  return { product };
}

/**
 * Check if product has variants
 */
function hasVariants(product) {
  return (
    (product.master || product.variationGroup) &&
    product.variationModel.variants.length > 0
  );
}

/**
 * Find first available variant
 */
function findAvailableVariant(variants) {
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    if (variant.availabilityModel.availability > 0) {
      return variant;
    }
  }
  return variants[0];
}

/**
 * Get appropriate product for pricing (handle variants)
 */
function getProductForPricing(product) {
  if (hasVariants(product)) {
    const [variants] = [product.variationModel.variants];
    return findAvailableVariant(variants);
  }
  return product;
}

/**
 * Check if product has tiered pricing
 */
function hasTieredPricing(priceTable) {
  return (
    priceTable && priceTable.quantities && priceTable.quantities.length > 1
  );
}

/**
 * Find quantity tier for given quantity
 */
function findQuantityTier(quantities, qty) {
  let selectedQuantity = null;
  for (let i = 0; i < quantities.length; i++) {
    const tierQty = quantities[i].getValue();
    if (qty >= tierQty) {
      selectedQuantity = quantities[i];
    }
  }
  return selectedQuantity;
}

/**
 * Calculate price based on quantity (handle tiered pricing)
 */
function calculateProductPrice(priceModel, qty) {
  const priceTable = priceModel.getPriceTable();

  if (hasTieredPricing(priceTable)) {
    const quantities = priceTable.getQuantities();
    const selectedQuantity = findQuantityTier(quantities, qty);
    return selectedQuantity
      ? priceTable.getPrice(selectedQuantity)
      : priceModel.getPrice();
  }

  return priceModel.getPrice();
}

/**
 * Get final unit price including promotions
 */
function getFinalUnitPrice(product, basePrice) {
  const promotionalPrice = priceHelper.getPromotionPrice(product, null, null);
  return promotionalPrice &&
    promotionalPrice.available &&
    promotionalPrice.value < basePrice.value
    ? promotionalPrice
    : basePrice;
}

/**
 * Handle price calculation response
 */
function sendPriceResponse(res, next, product, price, qty) {
  const unitPrice = getFinalUnitPrice(product, price);
  const totalAmount = unitPrice.multiply(qty);

  res.json({
    success: true,
    totalAmount: {
      value: totalAmount.value,
      currencyCode: totalAmount.currencyCode,
    },
  });
  return next();
}

/**
 * Handle error response
 */
function sendErrorResponse(res, next) {
  res.json({ success: false, error: true });
  return next();
}

/**
 * Process price calculation for validated product
 */
function processPriceCalculation(product, qty, res, next) {
  const priceModel = product.getPriceModel();

  if (!priceModel) {
    AdyenLogs.error_log(
      'Price model not available for product',
      product.ID || 'unknown',
    );
    return sendErrorResponse(res, next);
  }

  const price = calculateProductPrice(priceModel, qty);

  if (!price) {
    AdyenLogs.error_log(
      'Price not available for product',
      product.ID || 'unknown',
    );
    return sendErrorResponse(res, next);
  }

  return sendPriceResponse(res, next, product, price, qty);
}

/**
 * Calculate product total price based on product ID
 */
function calculatePrice(req, res, next) {
  try {
    const { pid, quantity = 1 } = req.form;

    const validation = validateProduct(pid);
    if (validation.error) {
      throw new AdyenError('Validation failed for product');
    }

    const product = getProductForPricing(validation.product);
    const qty = parseInt(quantity, 10) || 1;

    return processPriceCalculation(product, qty, res, next);
  } catch (error) {
    AdyenLogs.error_log(
      'An error occurred while calculating the product price',
      error,
    );
    setErrorType(error, res, {
      errorMessage: Resource.msg(
        'error.cannot.get.product.price',
        'product',
        null,
      ),
    });
    return sendErrorResponse(res, next);
  }
}

module.exports = calculatePrice;
