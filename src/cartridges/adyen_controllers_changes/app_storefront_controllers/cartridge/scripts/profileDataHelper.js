'use strict';

/**
 * This script will generate json file with the current users data for
 * profile, product lists, orders, wallet, addresses, and a place holder for third party information.
 *
 */

var OrderMgr = require('dw/order/OrderMgr');
function getProfile(profile){
    var profileObj = {
        birthday: profile.birthday,
        companyName: profile.companyName,
        customerNo: profile.customerNo,
        email: profile.email,
        fax: profile.fax,
        firstName: profile.firstName,
        gender: profile.gender.displayValue,
        jobTitle: profile.jobTitle,
        lastLoginTime: profile.lastLoginTime,
        lastName: profile.lastName,
        lastVisitTime: profile.lastVisitTime,
        phoneBusiness: profile.phoneBusiness,
        phoneHome: profile.phoneHome,
        phoneMobile: profile.phoneMobile,
        preferredLocale: profile.preferredLocale,
        previousLoginTime: profile.previousLoginTime,
        previousVisitTime: profile.previousVisitTime,
        salutation: profile.salutation,
        secondName: profile.secondName,
        suffix: profile.suffix,
        taxID: profile.taxID,
        taxIDMasked: profile.taxIDMasked,
        taxIDType: profile.taxIDType,
        title: profile.title,
        male: profile.male,
        female: profile.female,
        nextBirthday: profile.nextBirthday
    };
    return profileObj;
}


function getAddressBook(profile) {
    var addressBookObj = [];
    var addresses = profile.addressBook.addresses;
    addresses.toArray().forEach(function(address) {
        addressBookObj.push({
            address1: address.address1,
            address2: address.address2,
            city: address.city,
            companyName: address.companyName,
            countryCode: address.countryCode.displayValue,
            firstName: address.firstName,
            fullName: address.fullName,
            id: address.ID,
            jobTitle: address.jobTitle,
            lastName: address.lastName,
            phone: address.phone,
            postalCode: address.postalCode,
            postBox: address.postBox,
            salutation: address.salutation,
            secondName: address.secondName,
            stateCode: address.stateCode,
            suffix: address.suffix,
            suite: address.suite,
            title: address.title
        });
    });
    return addressBookObj;
}

function getWallet (profile) {
    var walletObj = [];
    var paymentInstruments = profile.wallet.paymentInstruments;
    paymentInstruments.toArray().forEach(function(paymentInstrument){
        walletObj.push({
            creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
            creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
            creditCardHolder: paymentInstrument.creditCardHolder,
            maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber
        });
    });
    return walletObj;
}

function getOrders(profile) {
    var ordersObj = [];

    var orders = OrderMgr.searchOrders('customerNo={0} AND status!={1}', 'creationDate desc', profile.customerNo, dw.order.Order.ORDER_STATUS_REPLACED);
    while (orders.hasNext()) {
        var order = orders.next();
        var orderObj = {
            affiliatePartnerID: order.affiliatePartnerID,
            affiliatePartnerName: order.affiliatePartnerName,
            cancelCode: order.cancelCode,
            cancelDescription: order.cancelDescription,
            capturedAmount: order.capturedAmount.currencyCode + ' ' + order.capturedAmount.value,
            confirmationStatus: order.confirmationStatus.displayValue,
            createdBy: order.createdBy,
            currentOrderNo: order.currentOrderNo,
            customerLocaleID: order.customerLocaleID,
            customerOrderReference: order.customerOrderReference,
            invoiceNo: order.invoiceNo,
            orderNo: order.orderNo,
            orderToken: order.orderToken,
            originalOrder: order.originalOrder && order.originalOrder.orderNo !== order.orderNo
                ? {
                    affiliatePartnerID: order.originalOrder.affiliatePartnerID,
                    affiliatePartnerName: order.originalOrder.affiliatePartnerName,
                    cancelCode: order.originalOrder.cancelCode,
                    cancelDescription: order.originalOrder.cancelDescription,
                    capturedAmount: order.originalOrder.capturedAmount,
                    confirmationStatus: order.originalOrder.confirmationStatus,
                    createdBy: order.originalOrder.createdBy,
                    currentOrderNo: order.originalOrder.currentOrderNo,
                    customerLocaleID: order.originalOrder.customerLocaleID,
                    customerOrderReference: order.originalOrder.customerOrderReference,
                    invoiceNo: order.originalOrder.invoiceNo,
                    orderNo: order.originalOrder.orderNo,
                    orderToken: order.originalOrder.orderToken,
                    paymentStatus: order.originalOrder.paymentStatus.displayValue,
                    paymentInstruments: [],
                    paymentTransaction: order.originalOrder.paymentTransaction,
                    refundedAmount: order.originalOrder.refundedAmount,
                    remoteHost: order.originalOrder.remoteHost,
                    replaceCode: order.originalOrder.replaceCode,
                    replaceDescription: order.originalOrder.replaceDescription,
                    replacedOrderNo: order.originalOrder.replacedOrderNo,
                    shippingStatus: order.originalOrder.shippingStatus,
                    sourceCode: order.originalOrder.sourceCode,
                    sourceCodeGroup: order.originalOrder.sourceCodeGroup,
                    sourceCodeGroupID: order.originalOrder.sourceCodeGroupID,
                    status: order.originalOrder.status,
                    totalGrossPrice: order.originalOrder.totalGrossPrice}
                : {},
            originalOrderNo: order.originalOrderNo,
            paymentStatus: order.paymentStatus.displayValue,
            paymentInstruments: [],
            paymentTransaction: order.paymentTransaction,
            refundedAmount: order.refundedAmount.currencyCode + ' ' + order.refundedAmount.value,
            remoteHost: order.remoteHost,
            replaceCode: order.replaceCode,
            replaceDescription: order.replaceDescription,
            replacedOrder: order.replacedOrder
                ? {
                    affiliatePartnerID: order.replacedOrder.affiliatePartnerID,
                    affiliatePartnerName: order.replacedOrder.affiliatePartnerName,
                    cancelCode: order.replacedOrder.cancelCode,
                    cancelDescription: order.replacedOrder.cancelDescription,
                    capturedAmount: order.replacedOrder.capturedAmount,
                    confirmationStatus: order.replacedOrder.confirmationStatus,
                    createdBy: order.replacedOrder.createdBy,
                    currentOrderNo: order.replacedOrder.currentOrderNo,
                    customerLocaleID: order.replacedOrder.customerLocaleID,
                    customerOrderReference: order.replacedOrder.customerOrderReference,
                    invoiceNo: order.replacedOrder.invoiceNo,
                    orderNo: order.replacedOrder.orderNo,
                    orderToken: order.replacedOrder.orderToken,
                    paymentStatus: order.replacedOrder.paymentStatus.displayValue,
                    paymentInstruments: [],
                    paymentTransaction: order.replacedOrder.paymentTransaction,
                    refundedAmount: order.replacedOrder.refundedAmount.currencyCode + ' ' + order.replacedOrder.refundedAmount.value,
                    remoteHost: order.replacedOrder.remoteHost,
                    replaceCode: order.replacedOrder.replaceCode,
                    replaceDescription: order.replacedOrder.replaceDescription,
                    replacedOrderNo: order.replacedOrder.replacedOrderNo,
                    shippingStatus: order.replacedOrder.shippingStatus.displayValue,
                    sourceCode: order.replacedOrder.sourceCode,
                    sourceCodeGroup: order.replacedOrder.sourceCodeGroup,
                    sourceCodeGroupID: order.replacedOrder.sourceCodeGroupID,
                    status: order.replacedOrder.status.displayValue,
                    totalGrossPrice: order.replacedOrder.totalGrossPrice.currencyCode + ' ' + order.replacedOrder.totalGrossPrice.value
                }
                : {},
            replacedOrderNo: order.replacedOrderNo,
            shippingStatus: order.shippingStatus.displayValue,
            sourceCode: order.sourceCode,
            sourceCodeGroup: order.sourceCodeGroup,
            sourceCodeGroupID: order.sourceCodeGroupID,
            status: order.status.displayValue,
            totalGrossPrice: order.totalGrossPrice.currencyCode + ' ' + order.totalGrossPrice.value
        };

        var orderPaymentInstruments = order.paymentInstruments;
        orderPaymentInstruments.toArray().forEach(function(paymentInstrument){
            orderObj.paymentInstruments.push({
                capturedAmount: paymentInstrument.capturedAmount.currencyCode + ' ' + paymentInstrument.capturedAmount.value,
                creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
                creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
                creditCardType: paymentInstrument.creditCardType,
                creditCardHolder: paymentInstrument.creditCardHolder,
                maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
                maskedGiftCertificateCode: paymentInstrument.maskedGiftCertificateCode,
                paymentMethod: paymentInstrument.paymentMethod
            });
        });
        ordersObj.push(orderObj);
    }

    return ordersObj;
}

function getWishLists (ProductListMgr) {
    var wishListsObj = [];
    var whishlists = ProductListMgr.getProductLists(customer, dw.customer.ProductList.TYPE_WISH_LIST).toArray();
    whishlists.forEach(function(wishlist){
        wishListsObj.push({
            currentShippingAddress: wishlist.currentShippingAddress
                ? {
                    address1: wishlist.currentShippingAddress.address1,
                    address2: wishlist.currentShippingAddress.address2,
                    city: wishlist.currentShippingAddress.city,
                    companyName: wishlist.currentShippingAddress.companyName,
                    countryCode: wishlist.currentShippingAddress.countryCode,
                    firstName: wishlist.currentShippingAddress.firstName,
                    fullName: wishlist.currentShippingAddress.fullName,
                    id: wishlist.currentShippingAddress.ID,
                    jobTitle: wishlist.currentShippingAddress.jobTitle,
                    lastName: wishlist.currentShippingAddress.lastName,
                    phone: wishlist.currentShippingAddress.phone,
                    postalCode: wishlist.currentShippingAddress.postalCode,
                    postBox: wishlist.currentShippingAddress.postBox,
                    salutation: wishlist.currentShippingAddress.salutation,
                    secondName: wishlist.currentShippingAddress.secondName,
                    stateCode: wishlist.currentShippingAddress.stateCode,
                    suffix: wishlist.currentShippingAddress.suffix,
                    suite: wishlist.currentShippingAddress.suite,
                    title: wishlist.currentShippingAddress.title
                }
            : null,
            description: wishlist.description,
            eventCity: wishlist.eventCity,
            eventCountry: wishlist.eventCountry,
            eventDate: wishlist.eventDate,
            eventState: wishlist.eventState,
            eventType: wishlist.eventType,
            exportStatus: wishlist.exportStatus.displayValue,
            id: wishlist.ID,
            lastExportTime: wishlist.lastExportTime,
            name: wishlist.name,
            postEventShippingAddress: wishlist.postEventShippingAddress,
            public: wishlist.public,
            registrant: wishlist.registrant,
            shippingAddress: {
                address1: wishlist.shippingAddress ? wishlist.shippingAddress.address1: null,
                address2: wishlist.shippingAddress ? wishlist.shippingAddress.address2 : null,
                city: wishlist.shippingAddress ? wishlist.shippingAddress.city : null,
                companyName: wishlist.shippingAddress ? wishlist.shippingAddress.companyName : null,
                countryCode: wishlist.shippingAddress ? wishlist.shippingAddress.countryCode.displayValue : null,
                firstName: wishlist.shippingAddress ? wishlist.shippingAddress.firstName : null,
                fullName: wishlist.shippingAddress ? wishlist.shippingAddress.fullName : null,
                id: wishlist.shippingAddress ? wishlist.shippingAddress.ID : null,
                jobTitle: wishlist.shippingAddress ? wishlist.shippingAddress.jobTitle : null,
                lastName: wishlist.shippingAddress ? wishlist.shippingAddress.lastName : null,
                phone: wishlist.shippingAddress ? wishlist.shippingAddress.phone : null,
                postalCode: wishlist.shippingAddress ? wishlist.shippingAddress.postalCode : null,
                postBox: wishlist.shippingAddress ? wishlist.shippingAddress.postBox : null,
                salutation: wishlist.shippingAddress ? wishlist.shippingAddress.salutation : null,
                secondName: wishlist.shippingAddress ? wishlist.shippingAddress.secondName : null,
                stateCode: wishlist.shippingAddress ? wishlist.shippingAddress.stateCode : null,
                suffix: wishlist.shippingAddress ? wishlist.shippingAddress.suffix : null,
                suite: wishlist.shippingAddress ? wishlist.shippingAddress.suite : null,
                title: wishlist.shippingAddress ? wishlist.shippingAddress.title : null
            },
            type: wishlist.type
        });
    });

    return wishListsObj;
}

function getGiftregistries (ProductListMgr) {
    var giftregistriesObj = [];

    var giftregistries = ProductListMgr.getProductLists(customer, dw.customer.ProductList.TYPE_GIFT_REGISTRY).toArray();
    giftregistries.forEach(function(giftregistry){
        giftregistriesObj.push({
            description: giftregistry.description,
            eventCity: giftregistry.eventCity,
            eventCountry: giftregistry.eventCountry,
            eventDate: giftregistry.eventDate,
            eventState: giftregistry.eventState,
            eventType: giftregistry.eventType,
            exportStatus: giftregistry.exportStatus.displayValue,
            id: giftregistry.ID,
            lastExportTime: giftregistry.lastExportTime,
            name: giftregistry.name,
            postEventShippingAddress: {
                address1: giftregistry.postEventShippingAddress.address1,
                address2: giftregistry.postEventShippingAddress.address2,
                city: giftregistry.postEventShippingAddress.city,
                companyName: giftregistry.postEventShippingAddress.companyName,
                countryCode: giftregistry.postEventShippingAddress.countryCode.displayValue,
                firstName: giftregistry.postEventShippingAddress.firstName,
                fullName: giftregistry.postEventShippingAddress.fullName,
                id: giftregistry.postEventShippingAddress.ID,
                jobTitle: giftregistry.postEventShippingAddress.jobTitle,
                lastName: giftregistry.postEventShippingAddress.lastName,
                phone: giftregistry.postEventShippingAddress.phone,
                postalCode: giftregistry.postEventShippingAddress.postalCode,
                postBox: giftregistry.postEventShippingAddress.postBox,
                salutation: giftregistry.postEventShippingAddress.salutation,
                secondName: giftregistry.postEventShippingAddress.secondName,
                stateCode: giftregistry.postEventShippingAddress.stateCode,
                suffix: giftregistry.postEventShippingAddress.suffix,
                suite: giftregistry.postEventShippingAddress.suite,
                title: giftregistry.postEventShippingAddress.title
            },
            public: giftregistry.public,
            registrant: {
                email: giftregistry.registrant.email,
                firstname: giftregistry.registrant.firstName,
                lastname: giftregistry.registrant.lastName,
                role: giftregistry.registrant.role
            },
            shippingAddress: {
                address1: giftregistry.shippingAddress.address1,
                address2: giftregistry.shippingAddress.address2,
                city: giftregistry.shippingAddress.city,
                companyName: giftregistry.shippingAddress.companyName,
                countryCode: giftregistry.shippingAddress.countryCode.displayValue,
                firstName: giftregistry.shippingAddress.firstName,
                fullName: giftregistry.shippingAddress.fullName,
                id: giftregistry.shippingAddress.ID,
                jobTitle: giftregistry.shippingAddress.jobTitle,
                lastName: giftregistry.shippingAddress.lastName,
                phone: giftregistry.shippingAddress.phone,
                postalCode: giftregistry.shippingAddress.postalCode,
                postBox: giftregistry.shippingAddress.postBox,
                salutation: giftregistry.shippingAddress.salutation,
                secondName: giftregistry.shippingAddress.secondName,
                stateCode: giftregistry.shippingAddress.stateCode,
                suffix: giftregistry.shippingAddress.suffix,
                suite: giftregistry.shippingAddress.suite,
                title: giftregistry.shippingAddress.title
            },
            currentShippingAddress: giftregistry.currentShippingAddress
                ? {
                    address1: giftregistry.currentShippingAddress.address1,
                    address2: giftregistry.currentShippingAddress.address2,
                    city: giftregistry.currentShippingAddress.city,
                    companyName: giftregistry.currentShippingAddress.companyName,
                    countryCode: giftregistry.currentShippingAddress.countryCode,
                    firstName: giftregistry.currentShippingAddress.firstName,
                    fullName: giftregistry.currentShippingAddress.fullName,
                    id: giftregistry.currentShippingAddress.ID,
                    jobTitle: giftregistry.currentShippingAddress.jobTitle,
                    lastName: giftregistry.currentShippingAddress.lastName,
                    phone: giftregistry.currentShippingAddress.phone,
                    postalCode: giftregistry.currentShippingAddress.postalCode,
                    postBox: giftregistry.currentShippingAddress.postBox,
                    salutation: giftregistry.currentShippingAddress.salutation,
                    secondName: giftregistry.currentShippingAddress.secondName,
                    stateCode: giftregistry.currentShippingAddress.stateCode,
                    suffix: giftregistry.currentShippingAddress.suffix,
                    suite: giftregistry.currentShippingAddress.suite,
                    title: giftregistry.currentShippingAddress.title
                }
                : null,
            type: giftregistry.type
        });
    });
    return giftregistriesObj;
}

function getShoppingLists (ProductListMgr) {
    var shoppingListObj = [];
    var shoppinglists = ProductListMgr.getProductLists(customer, dw.customer.ProductList.TYPE_SHOPPING_LIST).toArray();
    shoppinglists.forEach(function(shoppinglist){
        shoppingListObj.push({
            description: shoppinglist.description,
            eventCity: shoppinglist.eventCity,
            eventCountry: shoppinglist.eventCountry,
            eventDate: shoppinglist.eventDate,
            eventState: shoppinglist.eventState,
            eventType: shoppinglist.eventType,
            exportStatus: shoppinglist.exportStatus.displayValue,
            id: shoppinglist.ID,
            lastExportTime: shoppinglist.lastExportTime,
            name: shoppinglist.name,
            postEventShippingAddress: {
                address1: shoppinglist.postEventShippingAddress.address1,
                address2: shoppinglist.postEventShippingAddress.address2,
                city: shoppinglist.postEventShippingAddress.city,
                companyName: shoppinglist.postEventShippingAddress.companyName,
                countryCode: shoppinglist.postEventShippingAddress.countryCode.displayValue,
                firstName: shoppinglist.postEventShippingAddress.firstName,
                fullName: shoppinglist.postEventShippingAddress.fullName,
                id: shoppinglist.postEventShippingAddress.ID,
                jobTitle: shoppinglist.postEventShippingAddress.jobTitle,
                lastName: shoppinglist.postEventShippingAddress.lastName,
                phone: shoppinglist.postEventShippingAddress.phone,
                postalCode: shoppinglist.postEventShippingAddress.postalCode,
                postBox: shoppinglist.postEventShippingAddress.postBox,
                salutation: shoppinglist.postEventShippingAddress.salutation,
                secondName: shoppinglist.postEventShippingAddress.secondName,
                stateCode: shoppinglist.postEventShippingAddress.stateCode,
                suffix: shoppinglist.postEventShippingAddress.suffix,
                suite: shoppinglist.postEventShippingAddress.suite,
                title: shoppinglist.postEventShippingAddress.title
            },
            public: shoppinglist.public,
            registrant: {
                email: shoppinglist.registrant.email,
                firstname: shoppinglist.registrant.firstName,
                lastname: shoppinglist.registrant.lastName,
                role: shoppinglist.registrant.role
            },
            shippingAddress: {
                address1: shoppinglist.shippingAddress.address1,
                address2: shoppinglist.shippingAddress.address2,
                city: shoppinglist.shippingAddress.city,
                companyName: shoppinglist.shippingAddress.companyName,
                countryCode: shoppinglist.shippingAddress.countryCode.displayValue,
                firstName: shoppinglist.shippingAddress.firstName,
                fullName: shoppinglist.shippingAddress.fullName,
                id: shoppinglist.shippingAddress.ID,
                jobTitle: shoppinglist.shippingAddress.jobTitle,
                lastName: shoppinglist.shippingAddress.lastName,
                phone: shoppinglist.shippingAddress.phone,
                postalCode: shoppinglist.shippingAddress.postalCode,
                postBox: shoppinglist.shippingAddress.postBox,
                salutation: shoppinglist.shippingAddress.salutation,
                secondName: shoppinglist.shippingAddress.secondName,
                stateCode: shoppinglist.shippingAddress.stateCode,
                suffix: shoppinglist.shippingAddress.suffix,
                suite: shoppinglist.shippingAddress.suite,
                title: shoppinglist.shippingAddress.title
            },
            currentShippingAddress: shoppinglist.currentShippingAddress
                ? {
                    address1: shoppinglist.currentShippingAddress.address1,
                    address2: shoppinglist.currentShippingAddress.address2,
                    city: shoppinglist.currentShippingAddress.city,
                    companyName: shoppinglist.currentShippingAddress.companyName,
                    countryCode: shoppinglist.currentShippingAddress.countryCode,
                    firstName: shoppinglist.currentShippingAddress.firstName,
                    fullName: shoppinglist.currentShippingAddress.fullName,
                    id: shoppinglist.currentShippingAddress.ID,
                    jobTitle: shoppinglist.currentShippingAddress.jobTitle,
                    lastName: shoppinglist.currentShippingAddress.lastName,
                    phone: shoppinglist.currentShippingAddress.phone,
                    postalCode: shoppinglist.currentShippingAddress.postalCode,
                    postBox: shoppinglist.currentShippingAddress.postBox,
                    salutation: shoppinglist.currentShippingAddress.salutation,
                    secondName: shoppinglist.currentShippingAddress.secondName,
                    stateCode: shoppinglist.currentShippingAddress.stateCode,
                    suffix: shoppinglist.currentShippingAddress.suffix,
                    suite: shoppinglist.currentShippingAddress.suite,
                    title: shoppinglist.currentShippingAddress.title
                }
                : null,
            type: shoppinglist.type
        });
    });
    return shoppingListObj;
}

exports.getProfileData = function (profile) {
    var ProductListMgr = require('dw/customer/ProductListMgr');
    var downloadJSONObj = {};

    downloadJSONObj.profile = getProfile(profile);
    downloadJSONObj.addressbook = getAddressBook(profile);
    downloadJSONObj.wallet = getWallet(profile);
    downloadJSONObj.orders = getOrders(profile);
    downloadJSONObj.productList = {
        whishlists: getWishLists(ProductListMgr),
        giftregistries: getGiftregistries(ProductListMgr),
        shoppinglists: getShoppingLists(ProductListMgr)
    };

    downloadJSONObj.thirdpartydata = {};
    return JSON.stringify(downloadJSONObj, null, 2);
};
