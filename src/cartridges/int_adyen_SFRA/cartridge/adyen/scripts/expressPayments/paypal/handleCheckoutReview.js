function handleCheckoutReview(req, res, next) {
  res.render('cart/checkoutReview', {
    // additional data may be required later
  });
  return next();
}

module.exports = handleCheckoutReview;
