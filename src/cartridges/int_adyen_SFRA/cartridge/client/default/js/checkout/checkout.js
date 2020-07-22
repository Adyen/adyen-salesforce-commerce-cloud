import * as shippingHelpers from "base/checkout/shipping";
import * as billingHelpers from "base/checkout/billing";
import * as summaryHelpers from "base/checkout/summary";
import * as billing from "./billing";
import * as adyenCheckout from "../adyenCheckout";

export function updateCheckoutView() {
  $("body").on("checkout:updateCheckoutView", (e, data) => {
    shippingHelpers.methods.updateMultiShipInformation(data.order);
    summaryHelpers.updateTotals(data.order.totals);
    data.order.shipping.forEach((shipping) => {
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
    if (currentStage === "shipping") {
      adyenCheckout.methods.renderGenericComponent();
    }
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
}
