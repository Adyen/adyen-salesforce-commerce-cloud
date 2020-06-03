const shippingHelpers = require("base/checkout/shipping");
const billingHelpers = require("base/checkout/billing");
const summaryHelpers = require("base/checkout/summary");
const billing = require("./billing");
const adyenCheckout = require("../adyenCheckout");

module.exports = {
  updateCheckoutView: function () {
    $("body").on("checkout:updateCheckoutView", function (e, data) {
      shippingHelpers.methods.updateMultiShipInformation(data.order);
      summaryHelpers.updateTotals(data.order.totals);
      data.order.shipping.forEach(function (shipping) {
        shippingHelpers.methods.updateShippingInformation(
          shipping,
          data.order,
          data.customer,
          data.options
        );
      });
      const currentStage = location.search.substring(
        location.search.indexOf("=") + 1
      );
      if (currentStage === "shipping")
        adyenCheckout.methods.renderGenericComponent();
      billingHelpers.methods.updateBillingInformation(
        data.order,
        data.customer,
        data.options
      );
      billing.methods.updatePaymentInformation(data.order, data.options);
      summaryHelpers.updateOrderProductSummaryInformation(
        data.order,
        data.options
      );
    });
  },
};
