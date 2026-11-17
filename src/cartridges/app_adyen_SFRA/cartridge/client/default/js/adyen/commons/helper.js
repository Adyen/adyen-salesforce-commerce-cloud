function getBundledProductsFromDom() {
  return Array.from(document.querySelectorAll('.bundle-item')).map((item) => {
    const pidEl = item.querySelector('.product-id');
    const qtyLabel = item.querySelector('label.quantity');
    const pid = pidEl ? pidEl.textContent.trim() : undefined;
    let qty = 1;
    if (qtyLabel) {
      qty = parseInt(qtyLabel.getAttribute('data-quantity'), 10);
    }
    return { pid, quantity: Number.isNaN(qty) ? 1 : qty };
  });
}

function getSelectedQuantityFromDom() {
  const bundleQtyEl = document.querySelector('.bundle-footer .quantity-select');
  if (bundleQtyEl) return bundleQtyEl.value;
  const qtyEl = document.querySelector('.quantity-select');
  return qtyEl ? qtyEl.value : 1;
}

function computeBundledProducts(initialBundledProducts, isBundlePdp) {
  if (!isBundlePdp) return initialBundledProducts || [];
  if (initialBundledProducts && Array.isArray(initialBundledProducts)) {
    return initialBundledProducts;
  }
  return getBundledProductsFromDom();
}

function isBundleDetailPage() {
  return Boolean(
    document.querySelector('.product-bundle') ||
      document.querySelector('.bundle-item'),
  );
}

function buildTemporaryBasketPayload(parsedData) {
  const {
    id,
    options,
    bundledProducts: initialBundledProducts,
    selectedQuantity: initialSelectedQuantity,
  } = parsedData;

  const bundledProducts = computeBundledProducts(
    initialBundledProducts,
    isBundleDetailPage(),
  );

  const selectedQuantity =
    initialSelectedQuantity || getSelectedQuantityFromDom();

  return { id, bundledProducts, options, selectedQuantity };
}

module.exports = {
  buildTemporaryBasketPayload,
};
