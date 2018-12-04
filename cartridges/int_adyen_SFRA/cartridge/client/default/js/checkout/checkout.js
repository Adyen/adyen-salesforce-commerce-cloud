var shippingHelpers = require('base/checkout/shipping');
var billingHelpers = require('base/checkout/billing');
var summaryHelpers = require('base/checkout/summary');
var billing = require('./billing');

module.exports = {
    updateCheckoutView: function () {
        $('body').on('checkout:updateCheckoutView', function (e, data) {
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
            billingHelpers.methods.updateBillingInformation(
                data.order,
                data.customer,
                data.options
            );
            billing.methods.updatePaymentInformation(data.order, data.options);
            summaryHelpers.updateOrderProductSummaryInformation(data.order, data.options);
        });
    }
};