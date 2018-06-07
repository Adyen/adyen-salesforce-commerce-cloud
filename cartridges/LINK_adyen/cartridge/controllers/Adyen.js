'use strict';
var server = require('server');

var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var OrderMgr = require('dw/order/OrderMgr');

server.get('Adyen3D', server.middleware.https, function (req, res, next) {
     Logger.getLogger("Adyen").error("Adyen3DCall res " + JSON.stringify(res) + "req: " +  JSON.stringify(req));

     var IssuerURL = req.querystring.IssuerURL;
     var PaRequest = req.querystring.PaRequest;
     var MD = req.querystring.MD;
     var TermURL = URLUtils.https('Adyen-AuthorizeWithForm', 'MD', MD);

    res.render('adyenform', {
        issuerUrl: IssuerURL,
        paRequest: PaRequest,
        md: MD,
        ContinueURL: TermURL
    });
    next();
});

// server.post('CloseIFrame', server.middleware.https, function (req, res, next) {
//     Logger.getLogger("Adyen").error("CloseIFrame res " + JSON.stringify(res) + "req: " +  JSON.stringify(req.form));
//     var adyenResponse = {
//         MD: req.querystring.MD,
//         PaRes: req.form.PaRes //req.httpParameterMap.get("PaRes").stringValue
//     }
//     req.session.privacyCache.set('adyenResponse', adyenResponse);
//     res.render('adyenpaymentredirect', {
//         AdyenResponse: adyenResponse,
//         ContinueURL: URLUtils.https('Adyen-AuthorizeWithForm')
//     });
//     next();
// });

server.post('AuthorizeWithForm', server.middleware.https, function (req, res, next) {
    var adyenResponse = {
        MD: req.querystring.MD,
        PaRes: req.form.PaRes //req.httpParameterMap.get("PaRes").stringValue
    }
    req.session.privacyCache.set('adyenResponse', adyenResponse);
    Logger.getLogger("Adyen").error("authorizeWithForm res " + JSON.stringify(res) + "req: " +  JSON.stringify(adyenResponse));
    // var	adyen3DVerification = require('int_adyen/cartridge/scripts/adyen3DVerification'), result,
    //     order = session.custom.order,
    //     paymentInstrument = session.custom.paymentInstrument,
    //     adyenResponse  = session.custom.adyenResponse;

    var	adyen3DVerification = require('int_adyen/cartridge/scripts/adyen3DVerification'), result;
        //order = session.custom.order,
        //paymentInstrument = session.custom.paymentInstrument;

    Logger.getLogger("Adyen").error("authorize3DBefore " + adyenResponse);
    Transaction.begin();
    result = adyen3DVerification.verify({
        Order: order,
        //Amount: paymentInstrument.paymentTransaction.amount,
        //PaymentInstrument: paymentInstrument,
        CurrentSession: req.session,
        CurrentRequest: req.request,
        MD: adyenResponse.MD,
        PaResponse: adyenResponse.PaRes
    });

    //TODOBAS return back to Place Order call
    Logger.getLogger("Adyen").error("authorize3DResult " + JSON.stringify(result));

    if(result.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Delete this part, it is copied from Place Order
    Logger.getLogger("Adyen").error("PlaceOrderAuthorise3Dafter2");
    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order);
    Logger.getLogger("Adyen").error("placeOrderResult: " + JSON.stringify(placeOrderResult));
    if (placeOrderResult.error) {
        Transaction.rollback();
        Transaction.wrap(function () {
            OrderMgr.failOrder(order);
        });
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
    order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
    paymentInstrument.paymentTransaction.transactionID = result.RequestToken;
    Transaction.commit();
    COHelpers.sendConfirmationEmail(order, req.locale.id);

    // res.json({
    //     error: false,
    //     orderID: order.orderNo,
    //     orderToken: order.orderToken,
    //     continueUrl: URLUtils.url('Order-Confirm').toString()
    // });

    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });

    return next();
    //return result;
    // res.render('adyenpaymentredirect', {
    //     // ContinueURL: IssuerURL,
    //     // IssuerURL: IssuerURL,
    //     // PaRequest: PaRequest,
    //     // TermURL: TermURL,
    //     // Order: OrderObj
    //     ContinueURL: URLUtils.https('Adyen-AuthorizeWithForm')
    // });
});



module.exports = server.exports()