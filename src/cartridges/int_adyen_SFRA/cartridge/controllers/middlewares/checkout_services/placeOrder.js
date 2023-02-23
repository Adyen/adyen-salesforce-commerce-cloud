/* ### Custom Adyen cartridge start ### */
const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const constants = require('*/cartridge/adyenConstants/constants');
const { processPayment, isNotAdyen } = require('*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices');
const PaymentMgr = require('dw/order/PaymentMgr');
const Money = require('dw/value/Money');
const { clearForms } = require('*/cartridge/controllers/utils/index');

/* ### Custom Adyen cartridge end ### */

function placeOrder(req, res, next) {
    const BasketMgr = require('dw/order/BasketMgr');
    const OrderMgr = require('dw/order/OrderMgr');
    const Resource = require('dw/web/Resource');
    const Transaction = require('dw/system/Transaction');
    const URLUtils = require('dw/web/URLUtils');
    const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    const hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    const validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    const addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');

    const currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    /* ### Custom Adyen cartridge ### */
    if(isNotAdyen(currentBasket)) {
        return next();
    }
    /* ### Custom Adyen cartridge ### */

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    /* ### Custom Adyen cartridge start ### */
    // Cache order number in order to be able to restore cart later
    req.session.privacyCache.set('currentOrderNumber', order.orderNo);
    req.session.privacyCache.set('currentOrderToken', order.orderToken);

    // Handles payment authorization
    var handlePaymentResult = adyenHelpers.handlePayments(order);

    function createGiftCardPM(parsedGiftCardObj, divideBy) {
        let paymentInstrument;
        const paidGiftCardAmount = {
            value: parsedGiftCardObj.giftCard.amount.value,
            currency: parsedGiftCardObj.giftCard.amount.currency
        };
        const paidGiftCardAmountFormatted = new Money(paidGiftCardAmount.value, paidGiftCardAmount.currency).divide(divideBy);
        Transaction.wrap(() => {
            paymentInstrument = order.createPaymentInstrument(
                constants.METHOD_ADYEN_COMPONENT,
              paidGiftCardAmountFormatted,
            );
            const { paymentProcessor } = PaymentMgr.getPaymentMethod(
                paymentInstrument.paymentMethod,
            );
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.custom.adyenPaymentMethod = parsedGiftCardObj.giftCard.name;
            paymentInstrument.custom[`${constants.OMS_NAMESPACE}_Adyen_Payment_Method`] = parsedGiftCardObj.giftCard.name;
            paymentInstrument.custom.Adyen_Payment_Method_Variant = parsedGiftCardObj.giftCard.brand;
            paymentInstrument.custom[
              `${constants.OMS_NAMESPACE}_Adyen_Payment_Method_Variant`
              ] = parsedGiftCardObj.giftCard.brand;
            paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(parsedGiftCardObj);
            paymentInstrument.paymentTransaction.custom.Adyen_pspReference = parsedGiftCardObj.giftCard.pspReference;
        })
    }

    const mainPaymentInstrument = order.getPaymentInstruments(
      AdyenHelper.getOrderMainPaymentInstrumentType(order)
    )[0];

    // Check if gift cards were used
    const giftCardsAdded = currentBasket.custom?.adyenGiftCards
      ? JSON.parse(currentBasket.custom.adyenGiftCards)
      : null;
    if (giftCardsAdded) {
        giftCardsAdded.forEach((giftCard) => {
            const divideBy = AdyenHelper.getDivisorForCurrency(mainPaymentInstrument.paymentTransaction.getAmount());
            const amount = {
                value: giftCard.remainingAmount.value,
                currency: giftCard.remainingAmount.currency
            };
            const formattedAmount = new Money(amount.value, amount.currency).divide(divideBy);
            Transaction.wrap(() => {
                mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount); //update amount from order total to PM total
            });
            createGiftCardPM(giftCard, divideBy);
        });
    }
    /* ### Custom Adyen cartridge end ### */

    // Handle custom processing post authorization
    var options = {
        req: req,
        res: res
    };
    var postAuthCustomizations = hooksHelper('app.post.auth', 'postAuthorization', handlePaymentResult, order, options, require('*/cartridge/scripts/hooks/postAuthorizationHandling').postAuthorization);
    if (postAuthCustomizations && Object.prototype.hasOwnProperty.call(postAuthCustomizations, 'error')) {
        res.json(postAuthCustomizations);
        return next();
    }
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        this.emit('route:Complete', req, res);
        return;
    }

    /* ### Custom Adyen cartridge start ### */
    const cbEmitter = (route) => this.emit(route, req, res);
    if (
        handlePaymentResult.action &&
        handlePaymentResult.action?.type !== constants.ACTIONTYPES.VOUCHER
    ) {
        return processPayment(order, handlePaymentResult, req, res, cbEmitter);
    }
    /* ### Custom Adyen cartridge end ### */

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);

    if (placeOrderResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    if (req.currentCustomer.addressBook) {
        // save all used shipping addresses to address book of the logged in customer
        var allAddresses = addressHelpers.gatherShippingAddresses(order);
        allAddresses.forEach(function (address) {
            if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
            }
        });
    }

    if (order.getCustomerEmail()) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
    }

    clearForms.clearForms();
    if (mainPaymentInstrument) {
        clearForms.clearPaymentTransactionData(mainPaymentInstrument);
        clearForms.clearAdyenData(mainPaymentInstrument);
    }
    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    // TODO: Exposing a direct route to an Order, without at least encoding the orderID
    //  is a serious PII violation.  It enables looking up every customers orders, one at a
    //  time.
    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });
    this.emit('route:Complete', req, res);
}

module.exports = placeOrder;
