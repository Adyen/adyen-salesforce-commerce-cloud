'use strict';

/**
 * Controller that manages the order history of a registered user.
 *
 * @module controllers/Order
 */

/* API Includes */
var ContentMgr = require('dw/content/ContentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var PagingModel = require('dw/web/PagingModel');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');


/**
 * Renders a page with the order history of the current logged in customer.
 *
 * Creates a PagingModel for the orders with information from the httpParameterMap.
 * Invalidates and clears the orders.orderlist form. Updates the page metadata. Sets the
 * ContinueURL property to Order-Orders and renders the order history page (account/orderhistory/orders template).
 */
function history() {
    var orders = OrderMgr.searchOrders('customerNo={0} AND status!={1}', 'creationDate desc',
                                        customer.profile.customerNo, dw.order.Order.ORDER_STATUS_REPLACED);

    var parameterMap = request.httpParameterMap;
    var pageSize = parameterMap.sz.intValue || 5;
    var start = parameterMap.start.intValue || 0;
    var orderPagingModel = new PagingModel(orders, orders.count);
    orderPagingModel.setPageSize(pageSize);
    orderPagingModel.setStart(start);

    var orderListForm = app.getForm('orders.orderlist');
    orderListForm.invalidate();
    orderListForm.clear();
    orderListForm.copyFrom(orderPagingModel.pageElements);

    var pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update(ContentMgr.getContent('myaccount-orderhistory'));

    app.getView({
        OrderPagingModel: orderPagingModel,
        ContinueURL: dw.web.URLUtils.https('Order-Orders')
    }).render('account/orderhistory/orders');
}


/**
 * Gets an OrderView and renders the order detail page (account/orderhistory/orderdetails template). If there is an error,
 * redirects to the {@link module:controllers/Order~history|history} function.
 */
function orders() {
    var orderListForm = app.getForm('orders.orderlist');
    orderListForm.handleAction({
        show: function (formGroup, action) {
            var Order = action.object;

            app.getView({Order: Order}).render('account/orderhistory/orderdetails');
        },
        error: function () {
            response.redirect(dw.web.URLUtils.https('Order-History'));
        }
    });

}


/**
 * Renders a page with details of a single order. This function
 * renders the order details by the UUID of the order, therefore it can also be used
 * for unregistered customers to track the status of their orders. It
 * renders the order details page (account/orderhistory/orderdetails template), even
 * if the order cannot be found.
 */
function track () {
    var parameterMap = request.httpParameterMap;

    if (empty(parameterMap.orderID.stringValue)) {
        app.getView().render('account/orderhistory/orderdetails');
        return response;
    }

    var uuid = parameterMap.orderID.stringValue;
    var orders = OrderMgr.searchOrders('UUID={0} AND status!={1}', 'creationDate desc', uuid, dw.order.Order.ORDER_STATUS_REPLACED);

    if (empty(orders)) {
        app.getView().render('account/orderhistory/orderdetails');
    }

    var Order = orders.next();
    app.getView({Order: Order}).render('account/orderhistory/orderdetails');
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** Renders a page with the order history of the current logged in customer.
 * @see module:controllers/Order~history */
exports.History = guard.ensure(['get', 'https', 'loggedIn'], history);
/** Renders the order detail page.
 * @see module:controllers/Order~orders */
exports.Orders = guard.ensure(['post', 'https', 'loggedIn'], orders);
/** Renders a page with details of a single order.
 * @see module:controllers/Order~track */
exports.Track = guard.ensure(['get', 'https'], track);
