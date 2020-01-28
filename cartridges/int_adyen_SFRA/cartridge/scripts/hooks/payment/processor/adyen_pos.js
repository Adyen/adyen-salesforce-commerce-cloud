/**
 *
 */

'use strict';

var server = require("server");
var collections = require("*/cartridge/scripts/util/collections");
var Resource = require("dw/web/Resource");
var Transaction = require("dw/system/Transaction");
var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger');

function Handle(basket, paymentInformation) {
    Transaction.wrap(function () {
        collections.forEach(basket.getPaymentInstruments(), function (item) {
            basket.removePaymentInstrument(item);
        });

        var paymentInstrument = basket.createPaymentInstrument(
            "AdyenPOS", basket.totalGrossPrice
        );
        paymentInstrument.custom.adyenPaymentMethod = "POS Terminal";
    });

    return {error: false};
}

/**
 * Authorize
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var adyenTerminalApi = require("*/cartridge/scripts/adyenTerminalApi");
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNumber;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    var adyenPaymentForm = server.forms.getForm("billing").adyenPaymentFields;
    var OrderMgr = require("dw/order/OrderMgr");
    var order = OrderMgr.getOrder(orderNumber);

    var terminalId = null;
    if(adyenPaymentForm.terminalId.value){
        terminalId = adyenPaymentForm.terminalId.value;
    }

    Transaction.begin();
    var result = adyenTerminalApi.createTerminalPayment(order, paymentInstrument, terminalId);
    if (result.error) {
        Logger.getLogger("Adyen").error("POS Authorise error, result: " + result.response);
        var errors = [];
        errors.push(Resource.msg("error.payment.processor.not.supported", "checkout", null));
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }
    else {
        var terminalResponse = JSON.parse(result.response);
        if (terminalResponse.SaleToPOIResponse) {
            var paymentResponse = terminalResponse.SaleToPOIResponse.PaymentResponse;
            if (paymentResponse.Response.Result == "Success") {
                order.custom.Adyen_eventCode = "AUTHORISATION";
                var pspReference = "";
                if (!empty(paymentResponse.PaymentResult.PaymentAcquirerData.AcquirerTransactionID.TransactionID)) {
                    pspReference = paymentResponse.PaymentResult.PaymentAcquirerData.AcquirerTransactionID.TransactionID;
                } else if (!empty(paymentResponse.POIData.POITransactionID.TransactionID)) {
                    pspReference = paymentResponse.POIData.POITransactionID.TransactionID.split(".")[1];
                }
                // Save full response to transaction custom attribute
                paymentInstrument.paymentTransaction.transactionID = pspReference;
                order.custom.Adyen_pspReference = pspReference;
                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                order.setExportStatus(Order.EXPORT_STATUS_READY);
                paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(paymentResponse);
                Transaction.commit();
                return {authorized: true};
            }
        }
    }
    Logger.getLogger("Adyen").error("POS error in response, payment result: " + JSON.stringify(paymentResponse.PaymentResult));
    Transaction.rollback();
    return {
        error: true,
        PlaceOrderError: ("AdyenErrorMessage" in result && !empty(result.AdyenErrorMessage) ? result.AdyenErrorMessage : "")
    };
}


exports.Handle = Handle;
exports.Authorize = Authorize;