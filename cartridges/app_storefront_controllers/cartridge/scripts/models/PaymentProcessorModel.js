'use strict';

/**
Model for payment processing functionality.
@module models/PaymentProcessorModel
*/
var Class = require('~/cartridge/scripts/util/Class').Class;
var HookMgr = require('dw/system/HookMgr');
var PaymentMgr = require('dw/order/PaymentMgr');

/**
 * Payment processor model used to execute payment processor with methods that use the hook concept of the
 * Salesforce Commerce Cloud platform.
 *
 * @class module:models/PaymentProcessorModel~PaymentProcessorModel
 * @extends module:util/Class
 */
var PaymentProcessorModel = Class.extend({
    /** @lends module:models/PaymentProcessorModel~PaymentProcessorModel.prototype */
});

/**
 * Executes the provider and method-specific form validation and payment instrument creation. The payment provider and method-specific
 * logic is executed using a dynamic hook. The hook to execute is identified by the key
 * 'app.payment.processor.' + processor.ID. The method executed is named 'Handle'. If no payment provider and method-specific
 * hook can be found, the method 'Handle' of the default hook 'app.payment.processor.default' is executed.
 *
 * @alias module:models/PaymentProcessorModel~PaymentProcessorModel/handle
 * @param {dw.order.Basket} cart The order to validate.
 * @param {String} paymentMethodID The ID of payment method to execute the validation logic for.
 * @returns {*}
 */
PaymentProcessorModel.handle = function (cart, paymentMethodID) {
    var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();
    if (dw.system.HookMgr.hasHook('app.payment.processor.' + processor.ID)) {
        return dw.system.HookMgr.callHook('app.payment.processor.' + processor.ID, 'Handle', {
            Basket: cart,
            PaymentMethodID: paymentMethodID
        });
    } else {
        return dw.system.HookMgr.callHook('app.payment.processor.default', 'Handle', {
            Basket: cart,
            PaymentMethodID: paymentMethodID
        });
    }
};

/**
 * Executes the provider and method-specific payment authorization logic. The payment provider and method-specific logic is
 * executed using a dynamic hook. The hook to execute is identified by the key 'app.payment.processor.' + processor.ID.
 * The method executed is named 'Authorize'. If no payment provider and method-specific specific hook can be found, the method
 * 'Authorize' of the default hook 'app.payment.processor.default' is executed.
 *
 * @alias module:models/PaymentProcessorModel~PaymentProcessorModel/authorize
 * @param {dw.order.Order} order The order to authorize.
 * @param {dw.order.PaymentInstrument} paymentInstrument The payment instrument to execute the authorization logic for.
 * @returns whatever is returned from calling the hook.
 */
PaymentProcessorModel.authorize = function (order, paymentInstrument) {
    var processor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
    if (HookMgr.hasHook('app.payment.processor.' + processor.ID)) {
        return HookMgr.callHook('app.payment.processor.' + processor.ID, 'Authorize', {
            Order: order,
            OrderNo: order.getOrderNo(),
            PaymentInstrument: paymentInstrument
        });
    } else {
        return HookMgr.callHook('app.payment.processor.default', 'Authorize', {
            Order: order,
            OrderNo: order.getOrderNo(),
            PaymentInstrument: paymentInstrument
        });
    }
};

/** The PaymentProcessorModel class */
module.exports = PaymentProcessorModel;
