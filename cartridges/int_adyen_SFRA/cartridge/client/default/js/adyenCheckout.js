var threeDS2utils = require('./threeds2-js-utils.js');

const configuration = {
    locale: $('#currentLocale').val(), // Defaults to en_US
    originKey: originKey,
    loadingContext: loadingContext
};

const checkout = new AdyenCheckout(configuration);
const cardNode = document.getElementById('card');
var oneClickCard = [];
var card;
var idealComponent;
var afterpayComponent;
var klarnaComponent;
var isValid = false;

getConfigurationComponents();

$(document).ready(function () {
    displayPaymentMethods();
});

var originKey = "";
var loadingContext = "";

function setConfigData(data, callback) {
    originKey = data.adyenOriginKey[Object.keys(data.adyenOriginKey)[0]];
    loadingContext = data.adyenLoadingContext;
    callback();
};

function renderCardComponent() {
    card = checkout.create('card', {
        // Mandatory fields
        originKey: originKey,
        loadingContext: loadingContext, // The environment where we should loads the secured fields from
        type: 'card',
        hasHolderName: true,
        holderNameRequired: true,
        groupTypes: ["bcmc", "maestro", "visa", "mc", "amex", "diners", "discover"],

        // Events
        onChange: function (state) {
            isValid = state.isValid;
        }, // Gets triggered whenever a user changes input
        onBrand: function (brandObject) {
            $('#cardType').val(brandObject.brand);
        } // Called once we detect the card brand
    });
    card.mount(cardNode);
};

var oneClickValid = false;

function renderOneClickComponents() {
    var componentContainers = document.getElementsByClassName("cvc-container");
    jQuery.each(componentContainers, function (i, oneClickCardNode) {
        var container = document.getElementById(oneClickCardNode.id);
        var cardId = container.id.split("-")[1];
        var brandCode = document.getElementById('cardType-' + cardId).innerText;

        oneClickCard[i] = checkout.create('card', {
            //Get selected card, send in payment request
            originKey: originKey,
            loadingContext: loadingContext, // The environment where we should loads the secured fields from
            // Specific for oneClick cards

            storedDetails: {
                "card": {
                    "expiryMonth": "",
                    "expiryYear": "",
                    "holderName": "",
                    "number": ""
                }
            },
            details: brandCode.includes('Bancontact') ? [] : [{"key": "cardDetails.cvc", "type": "cvc"}],
            onChange: function (state) {
                oneClickValid = state.isValid;
                if (state.isValid) {
                    $('#adyenEncryptedSecurityCode').val(state.data.encryptedSecurityCode);
                }
            } // Gets triggered whenever a user changes input
        }).mount(container);
    });
};

function getConfigurationComponents() {
    $.ajax({
        url: 'Adyen-GetConfigurationComponents',
        type: 'get',
        data: {protocol: window.location.protocol},
        success: function (data) {
            if (!data.error) {
                setConfigData(data, function () {
                    renderCardComponent();
                    renderOneClickComponents();
                });
            } else {
                $('#errorLoadComponent').text(data.errorMessage);
            }
        }
    });
};

function setBrowserData() {
    var browserData = threeDS2utils.getBrowserInfo();
    $('#browserInfo').val(JSON.stringify(browserData));
};

$('.payment-summary .edit-button').on('click', function (e) {
    jQuery.each(oneClickCard, function (i) {
        oneClickCard[i].unmount();
    });
    renderOneClickComponents();
    oneClickValid = false;
});

function displayPaymentMethods() {
    $('#paymentMethodsUl').empty();
    if ($('#directoryLookup').val() == 'true') {
        getPaymentMethods(function (data) {
            jQuery.each(data.AdyenHppPaymentMethods, function (i, method) {
                addPaymentMethod(method, data.ImagePath, data.AdyenDescriptions[i].description);
            });

            $('input[type=radio][name=brandCode]').change(function () {
                resetPaymentMethod();
                $('#component_' + $(this).val()).show();
            });
        });
    }
};

function resetPaymentMethod() {
    $('#requiredBrandCode').hide();
    $('#selectedIssuer').val("");
    $('#adyenIssuerName').val("");
    $('#dateOfBirth').val("");
    $('#telephoneNumber').val("");
    $('#gender').val("");
    $('#bankAccountOwnerName').val("");
    $('#bankAccountNumber').val("");
    $('#bankLocationId').val("");
    $('.additionalFields').hide();
};

function getPaymentMethods(paymentMethods) {
    $.ajax({
        url: 'Adyen-GetPaymentMethods',
        type: 'get',
        success: function (data) {
            paymentMethods(data);
        }
    });
};

function addPaymentMethod(paymentMethod, imagePath, description) {
    var li = $('<li>').addClass('paymentMethod');
    li.append($('<input>')
        .attr('id', 'rb_' + paymentMethod.name)
        .attr('type', 'radio')
        .attr('name', 'brandCode')
        .attr('value', paymentMethod.type));
    li.append($('<img>').addClass('paymentMethod_img').attr('src', imagePath + paymentMethod.type + '.png'));
    li.append($('<label>').text(paymentMethod.name).attr('for', 'rb_' + paymentMethod.name));
    li.append($('<p>').text(description));

    if (paymentMethod.type == "ideal") {
        var idealContainer = document.createElement("div");
        $(idealContainer).addClass('additionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
        idealComponent = checkout.create('ideal', {
            details: paymentMethod.details
        });
        li.append(idealContainer);
        idealComponent.mount(idealContainer);
    }

    if (paymentMethod.type.indexOf("klarna") !== -1) {
        var klarnaContainer = document.createElement("div");
        $(klarnaContainer).addClass('additionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
        klarnaComponent = checkout.create('klarna', {
            countryCode: $('#currentLocale').val(),
            details: filterOutOpenInvoiceComponentDetails(paymentMethod.details),
            visibility: {
                personalDetails: "editable"
            }
        });
        klarnaComponent.mount(klarnaContainer);

        if (isNordicCountry($('#shippingCountry').val())) {
            var ssnContainer = document.createElement("div");
            $(ssnContainer).attr('id', 'ssn_' + paymentMethod.type);
            var socialSecurityNumberLabel = document.createElement("span");
            $(socialSecurityNumberLabel).text("Social Security Number").attr('class', 'adyen-checkout__label');
            var socialSecurityNumber = document.createElement("input");
            $(socialSecurityNumber).attr('id', 'ssnValue').attr('class', 'adyen-checkout__input').attr('type', 'text'); //.attr('maxlength', ssnLength);

            ssnContainer.append(socialSecurityNumberLabel);
            ssnContainer.append(socialSecurityNumber);
            klarnaContainer.append(ssnContainer);
        }

        li.append(klarnaContainer);

    }
    ;

    if (paymentMethod.type.indexOf("afterpay_default") !== -1) {
        var afterpayContainer = document.createElement("div");
        $(afterpayContainer).addClass('additionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
        afterpayComponent = checkout.create('afterpay', {
            countryCode: $('#currentLocale').val(),
            details: filterOutOpenInvoiceComponentDetails(paymentMethod.details),
            visibility: {
                personalDetails: "editable"
            }
        });
        li.append(afterpayContainer);
        afterpayComponent.mount(afterpayContainer);
    }
    ;

    if (paymentMethod.type.substring(0, 3) == "ach") {
        var achContainer = document.createElement("div");
        $(achContainer).addClass('additionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');

        var bankAccountOwnerNameLabel = document.createElement("span");
        $(bankAccountOwnerNameLabel).text("Bank Account Owner Name").attr('class', 'adyen-checkout__label');
        var bankAccountOwnerName = document.createElement("input");
        $(bankAccountOwnerName).attr('id', 'bankAccountOwnerNameValue').attr('class', 'adyen-checkout__input').attr('type', 'text');

        var bankAccountNumberLabel = document.createElement("span");
        $(bankAccountNumberLabel).text("Bank Account Number").attr('class', 'adyen-checkout__label');
        var bankAccountNumber = document.createElement("input");
        $(bankAccountNumber).attr('id', 'bankAccountNumberValue').attr('class', 'adyen-checkout__input').attr('type', 'text').attr('maxlength', 17);

        var bankLocationIdLabel = document.createElement("span");
        $(bankLocationIdLabel).text("Routing Number").attr('class', 'adyen-checkout__label');
        var bankLocationId = document.createElement("input");
        $(bankLocationId).attr('id', 'bankLocationIdValue').attr('class', 'adyen-checkout__input').attr('type', 'text').attr('maxlength', 9);


        achContainer.append(bankAccountOwnerNameLabel);
        achContainer.append(bankAccountOwnerName);

        achContainer.append(bankAccountNumberLabel);
        achContainer.append(bankAccountNumber);

        achContainer.append(bankLocationIdLabel);
        achContainer.append(bankLocationId);

        li.append(achContainer);
    }

    if (paymentMethod.details) {
        if (paymentMethod.details.constructor == Array && paymentMethod.details[0].key == "issuer") {
            var additionalFields = $('<div>').addClass('additionalFields')
                .attr('id', 'component_' + paymentMethod.type)
                .attr('style', 'display:none');

            var issuers = $('<select>').attr('id', 'issuerList');
            jQuery.each(paymentMethod.details[0].items, function (i, issuer) {
                var issuer = $('<option>')
                    .attr('label', issuer.name)
                    .attr('value', issuer.id);
                issuers.append(issuer);
            });
            additionalFields.append(issuers);
            li.append(additionalFields);
        }
    }

    $('#paymentMethodsUl').append(li);
};


//Filter fields for open invoice validation
function filterOutOpenInvoiceComponentDetails(details) {
    var filteredDetails = details.map(function (detail) {
        if (detail.key == "personalDetails") {
            var detailObject = detail.details.map(function (childDetail) {
                if (childDetail.key == 'dateOfBirth' ||
                    childDetail.key == 'telephoneNumber' ||
                    childDetail.key == 'gender') {
                    return childDetail;
                }
            });

            if (!!detailObject) {
                return {
                    "key": detail.key,
                    "type": detail.type,
                    "details": filterUndefinedItemsInArray(detailObject)
                };
            }
        }
    });

    return filterUndefinedItemsInArray(filteredDetails);
};

/**
 * Helper function to filter out the undefined items from an array
 * @param arr
 * @returns {*}
 */
function filterUndefinedItemsInArray(arr) {
    return arr.filter(function (item) {
        return typeof item !== 'undefined';
    });
};

function isNordicCountry(country) {
    if (country === "SE" || country === "FI" || country === "DK" || country === "NO") {
        return true;
    }
    return false;
};

//Submit the payment
$('button[value="submit-payment"]').on('click', function (e) {
    if ($('#selectedPaymentOption').val() == 'CREDIT_CARD') {
        //new card payment
        if ($('.payment-information').data('is-new-payment')) {
            if (!isValid) {
                return false;
            } else {
                $('#selectedCardID').val('');
                setPaymentData();
            }
        }
        //oneclick payment
        else {
            var uuid = $('.selected-payment').data('uuid');
            if (!oneClickValid) {
                return false;
            } else {
                var selectedCardType = document.getElementById('cardType-' + uuid).innerText;
                document.getElementById('saved-payment-security-code-' + uuid).value = "000";
                $('#cardType').val(selectedCardType)
                $('#selectedCardID').val($('.selected-payment').data('uuid'));
                return true;
            }
        }
    } else if ($('#selectedPaymentOption').val() == 'Adyen') {
        var selectedMethod = $("input[name='brandCode']:checked");
        //no payment method selected
        if (!adyenPaymentMethodSelected(selectedMethod.val())) {
            $('#requiredBrandCode').show();
            return false;
        }
        //check component details
        else {
            var componentState = checkComponentDetails(selectedMethod);
            $('#adyenPaymentMethod').val($("input[name='brandCode']:checked").attr('id').substr(3));
            return componentState;
        }
    }

    return true;
});

function checkComponentDetails(selectedMethod) {
    //set data from components
    if (selectedMethod.val() == "ideal") {
        if (idealComponent.componentRef.state.isValid) {
            $('#selectedIssuer').val(idealComponent.componentRef.state.data.issuer);
            $('#adyenIssuerName').val(idealComponent.componentRef.props.items.find(x => x.id == idealComponent.componentRef.state.data.issuer).name);
        }
        return idealComponent.componentRef.state.isValid;
    } else if (selectedMethod.val().indexOf("klarna") > -1) {
        if (klarnaComponent.componentRef.state.isValid) {
            setOpenInvoiceData(klarnaComponent);
            if ($('#ssnValue')) {
                $('#socialSecurityNumber').val($('#ssnValue').val());
            }
        }
        return klarnaComponent.componentRef.state.isValid;
    } else if (selectedMethod.val().indexOf("afterpay_default") > -1) {
        if (afterpayComponent.componentRef.state.isValid) {
            setOpenInvoiceData(afterpayComponent);
        }
        return afterpayComponent.componentRef.state.isValid;
    }
    //if issuer is selected
    else if (selectedMethod.closest('li').find('.additionalFields #issuerList').val()) {
        $('#selectedIssuer').val(selectedMethod.closest('li').find('.additionalFields #issuerList').val());
        $('#adyenIssuerName').val(selectedMethod.closest('li').find('.additionalFields #issuerList').find('option:selected').attr('label'));
    } else if (selectedMethod.val().substring(0, 3) == "ach") {
        $('#bankAccountOwnerName').val($('#bankAccountOwnerNameValue').val());
        $('#bankAccountNumber').val($('#bankAccountNumberValue').val());
        $('#bankLocationId').val($('#bankLocationIdValue').val());

        if (!$('#bankLocationIdValue').val() || !$('#bankAccountNumberValue').val() || !$('#bankAccountOwnerNameValue').val()) {
            return false;
        }
    }

    return true;
}

function setOpenInvoiceData(component) {
    if(component.componentRef.state.data.personalDetails){
        if(component.componentRef.state.data.personalDetails.dateOfBirth){
            $('#dateOfBirth').val(component.componentRef.state.data.personalDetails.dateOfBirth);
        }
        if(component.componentRef.state.data.personalDetails.gender){
            $('#gender').val(component.componentRef.state.data.personalDetails.gender);
        }
        if(component.componentRef.state.data.personalDetails.telephoneNumber){
            $('#telephoneNumber').val(component.componentRef.state.data.personalDetails.telephoneNumber);
        }
    }
}

function adyenPaymentMethodSelected(selectedMethod) {
    if ($('#directoryLookup').val() == 'true') {
        if (!selectedMethod) {
            return false;
        }
    }
    return true;
}

$('button[value="add-new-payment"]').on('click', function (e) {
    setPaymentData();
});

function setPaymentData() {
    $('#adyenEncryptedCardNumber').val(card.paymentData.encryptedCardNumber);
    $('#adyenEncryptedExpiryMonth').val(card.paymentData.encryptedExpiryMonth);
    $('#adyenEncryptedExpiryYear').val(card.paymentData.encryptedExpiryYear);
    $('#adyenEncryptedSecurityCode').val(card.paymentData.encryptedSecurityCode);
    $('#cardOwner').val(card.paymentData.holderName);
    setBrowserData();
}

module.exports = {
    methods: {
        displayPaymentMethods: displayPaymentMethods
    }
};

