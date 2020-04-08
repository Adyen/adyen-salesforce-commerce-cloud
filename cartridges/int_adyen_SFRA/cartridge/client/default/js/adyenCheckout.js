
var isValid = false;
var storeDetails;
var oneClickCard = [];
var card;
var maskedCardNumber;
var MASKED_CC_PREFIX = '************';
var oneClickValid = false;
var selectedMethod;
var componentArr = [];
var checkoutConfiguration = window.Configuration;
// var checkout;

checkoutConfiguration.onChange = function(state, component){
    isValid = state.isValid;
    var type = state.data.paymentMethod.type;
    componentArr[type].isValid = isValid;
    componentArr[type].stateData = state.data;
};

checkoutConfiguration.paymentMethodsConfiguration = {
    card: {
        enableStoreDetails: showStoreDetails,
        onBrand: function (brandObject) {
            $('#cardType').val(brandObject.brand);
        },
        onFieldValid: function (data) {
            if (data.endDigits) {
                maskedCardNumber = MASKED_CC_PREFIX + data.endDigits;
                $("#cardNumber").val(maskedCardNumber);
            }
        },
        onChange: function (state, component) {
            storeDetails = state.data.storePaymentMethod;
            isValid = state.isValid;
            var type = state.data.paymentMethod.type;
            // Todo: fix onChange issues so we can get rid of componentName
            var componentName = component._node.id.replace('component_', '');
            componentName = componentName.replace('storedPaymentMethods', '');
            if(componentName === selectedMethod) {
                $('#browserInfo').val(JSON.stringify(state.data.browserInfo));
                componentArr[selectedMethod].isValid = isValid;
                componentArr[selectedMethod].stateData = state.data;
            }
        }
    },
    boletobancario: {
        personalDetailsRequired: true, // turn personalDetails section on/off
        billingAddressRequired: false, // turn billingAddress section on/off
        showEmailAddress: false, // allow shopper to specify their email address

        // Optionally prefill some fields, here all fields are filled:
        data: {
            socialSecurityNumber: '56861752509',
            firstName: document.getElementById("shippingFirstNamedefault").value,
            lastName: document.getElementById("shippingLastNamedefault").value
        }
    }
};
if(window.installments) {
    try {
        var installments = JSON.parse(window.installments);
        checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
    }
    catch (e) {}
}

function displaySelectedMethod(type) {
    selectedMethod = type;
    resetPaymentMethod();
    document.querySelector(`#component_${type}`).setAttribute('style', 'display:block');
}

function renderGenericComponent() {
    getPaymentMethods( function (data) {
        checkoutConfiguration.paymentMethodsResponse = data.AdyenPaymentMethods;
        if(data.amount) {
            checkoutConfiguration.amount = data.amount;
        }
        if(data.countryCode) {
            checkoutConfiguration.countryCode = data.countryCode;
        }
        document.querySelector("#paymentMethodsList").innerHTML = "";

        if(data.AdyenPaymentMethods.storedPaymentMethods) {
            for (var i = 0; i < checkout.paymentMethodsResponse.storedPaymentMethods.length; i++) {
                var paymentMethod = checkout.paymentMethodsResponse.storedPaymentMethods[i];
                if(paymentMethod.supportedShopperInteractions.includes("Ecommerce"))
                    renderPaymentMethod(paymentMethod,true, data.ImagePath);
            }
        }

        for (var i = 0; i < data.AdyenPaymentMethods.paymentMethods.length; i++) {
            var paymentMethod = data.AdyenPaymentMethods.paymentMethods[i];
            renderPaymentMethod(paymentMethod,false, data.ImagePath, data.AdyenDescriptions[i].description);
        }

        var firstPaymentMethod = document.querySelector('input[type=radio][name=brandCode]');
        firstPaymentMethod.checked = true;
        displaySelectedMethod(firstPaymentMethod.value);
    });
}

function renderPaymentMethod(paymentMethod, storedPaymentMethodBool, path, description = null) {
    var checkout = new AdyenCheckout(checkoutConfiguration);
    var paymentMethodsUI = document.querySelector('#paymentMethodsList');
    var li = document.createElement('li');
    var paymentMethodID = storedPaymentMethodBool? `storedCard${paymentMethod.id}` : paymentMethod.type;
    var imagePath = storedPaymentMethodBool? `${path}${paymentMethod.brand}.png` : `${path}${paymentMethod.type}.png`;
    var label = storedPaymentMethodBool? `${paymentMethod.name} ${MASKED_CC_PREFIX}${paymentMethod.lastFour}` : `${paymentMethod.name}`;
    var liContents = `
                              <input name="brandCode" type="radio" value="${paymentMethodID}" id="rb_${paymentMethodID}">
                              <img class="paymentMethod_img" src="${imagePath}" ></img>
                              <label id="lb_${paymentMethodID}" for="rb_${paymentMethodID}">${label}</label>
                             `;
    if(description)
        liContents += `<p>${description}</p>`;
    var container = document.createElement("div");

    li.innerHTML = liContents;
    li.classList.add('paymentMethod');

    try {
        if(storedPaymentMethodBool) {
            var node = checkout.create("card", paymentMethod).mount(container);
        } else {
            var fallback = getFallback(paymentMethod.type);
            if(fallback) {
                var template = document.createElement("template");
                template.innerHTML = fallback;
                container.append(template.content);
            } else {
                var node = checkout.create(paymentMethod.type).mount(container);
            }
        }
        componentArr[paymentMethodID] = node;
    } catch (e) {}

    container.classList.add("additionalFields");
    container.setAttribute("id", `component_${paymentMethodID}`);
    container.setAttribute("style", "display:none");

    li.append(container);

    paymentMethodsUI.append(li);
    var input = document.querySelector(`#rb_${paymentMethodID}`);

    input.onchange = (event) => {
        displaySelectedMethod(event.target.value);
    };
}

// $('.payment-summary .edit-button').on('click', function (e) {
//     jQuery.each(oneClickCard, function (i) {
//         oneClickCard[i].unmount();
//     });
//     renderOneClickComponents();
//     oneClickValid = false;
// });

function displayPaymentMethods() {
    // $('#paymentMethodsUl').empty();
    // getPaymentMethods(function (data) {
    //     jQuery.each(data.AdyenPaymentMethods, function (i, method) {
    //         addPaymentMethod(method, data.ImagePath, data.AdyenDescriptions[i].description);
    //     });
    //
    //     $('input[type=radio][name=brandCode]').change(function () {
    //         resetPaymentMethod();
    //         $('#component_' + $(this).val()).show();
    //     });
    //
    //     if(data.AdyenConnectedTerminals && data.AdyenConnectedTerminals.uniqueTerminalIds && data.AdyenConnectedTerminals.uniqueTerminalIds.length > 0){
    //         $('#AdyenPosTerminals').empty();
    //         addPosTerminals(data.AdyenConnectedTerminals.uniqueTerminalIds);
    //     }
    // });
};

function addPosTerminals(terminals) {
    //create dropdown and populate connected terminals
    var dd_terminals = $("<select>").attr("id", "terminalList");
    for(var i=0; i< terminals.length;i++) {
        $("<option/>", {
            value: terminals[i],
            html: terminals[i]
        }).appendTo(dd_terminals);
    }
    $('#AdyenPosTerminals').append(dd_terminals);
}

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

//Submit the payment
$('button[value="submit-payment"]').on('click', function () {
    var adyenPaymentMethod = document.querySelector("#adyenPaymentMethodName");
    var paymentMethodLabel = document.querySelector(`#lb_${selectedMethod}`).innerHTML;
    adyenPaymentMethod.value = paymentMethodLabel;

    validateComponents();

    return showValidation();
});

function showValidation() {
    if(componentArr[selectedMethod] && !componentArr[selectedMethod].isValid) {
        componentArr[selectedMethod].showValidation();
        return false;
    }
    else if(selectedMethod === "ach"){
        var inputs = document.querySelectorAll('#component_ach > input');
        inputs = Object.values(inputs).filter(function(input) {
            return !(input.value && input.value.length > 0);
        });
        for(var input of inputs) {
            input.classList.add('adyen-checkout__input--error');
        }
        if(inputs.length > 0)
            return false;
        return true;
    } else if(selectedMethod === "ratepay") {
        var input = document.querySelector("#dateOfBirthInput");
        if (!(input.value && input.value.length > 0)) {
            input.classList.add('adyen-checkout__input--error');
            return false;
        }
        return true;
    }
    return true;
}

function validateCustomInputField(input) {
    if(input.value === "")
        input.classList.add('adyen-checkout__input--error');
    else if(input.value.length > 0) {
        input.classList.remove('adyen-checkout__input--error');
    }
}

function validateComponents() {
    if(document.querySelector("#component_ach")) {
        var inputs = document.querySelectorAll('#component_ach > input');
        for (var input of inputs)
            input.onchange = function () {
                validateCustomInputField(this)
            };
    }
    if(document.querySelector("#dateOfBirthInput"))
        document.querySelector("#dateOfBirthInput").onchange = function() { validateCustomInputField(this)};

    var stateData;
    if(componentArr[selectedMethod] && componentArr[selectedMethod].stateData) {
        stateData = componentArr[selectedMethod].stateData;
    }
     else
        stateData = {paymentMethod: {type: selectedMethod}};

    if(selectedMethod === "ach") {
        var bankAccount = {
            ownerName: document.querySelector("#bankAccountOwnerNameValue").value,
            bankAccountNumber: document.querySelector("#bankAccountNumberValue").value,
            bankLocationId: document.querySelector("#bankLocationIdValue").value
        };
        stateData.paymentMethod = {...stateData.paymentMethod, bankAccount: bankAccount};
    } else if(selectedMethod === "ratepay") {
        if (document.querySelector("#genderInput").value && document.querySelector("#dateOfBirthInput").value) {
            stateData.paymentMethod.gender = document.querySelector("#genderInput").value;
            stateData.paymentMethod.dateOfBirth = document.querySelector("#dateOfBirthInput").value;
        }
    }
    document.querySelector("#adyenStateData").value = JSON.stringify(stateData);
}

function getFallback(paymentMethod) {
    var ach =  `<div id="component_ach">
                    <span class="adyen-checkout__label">Bank Account Owner Name</span>
                    <input type="text" id="bankAccountOwnerNameValue" class="adyen-checkout__input">
                    <span class="adyen-checkout__label">Bank Account Number</span>
                    <input type="text" id="bankAccountNumberValue" class="adyen-checkout__input" maxlength="17" >
                    <span class="adyen-checkout__label">Routing Number</span>
                    <input type="text" id="bankLocationIdValue" class="adyen-checkout__input" maxlength="9" >
                 </div>`;

    var ratepay =  `<span class="adyen-checkout__label">Gender</span>
                    <select id="genderInput" class="adyen-checkout__input">
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                    </select>
                    <span class="adyen-checkout__label">Date of birth</span>
                    <input id="dateOfBirthInput" class="adyen-checkout__input" type="date"/>`;

    var fallback = {ach: ach, ratepay: ratepay};
    return fallback[paymentMethod];
}

// function addPaymentMethod(paymentMethod, imagePath, description) {
//     var li = $('<li>').addClass('paymentMethod');
//     li.append($('<input>')
//         .attr('id', 'rb_' + paymentMethod.name)
//         .attr('type', 'radio')
//         .attr('name', 'brandCode')
//         .attr('value', paymentMethod.type));
//     li.append($('<img>').addClass('paymentMethod_img').attr('src', imagePath + paymentMethod.type + '.png'));
//     li.append($('<label>').text(paymentMethod.name).attr('for', 'rb_' + paymentMethod.name));
//     li.append($('<p>').text(description));
//
//     if (paymentMethod.type == "ideal") {
//         var idealContainer = document.createElement("div");
//         $(idealContainer).addClass('additionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
//         idealComponent = checkout.create('ideal', {
//             details: paymentMethod.details
//         });
//         li.append(idealContainer);
//         idealComponent.mount(idealContainer);
//     }
//
//     if (paymentMethod.type.indexOf("klarna") !== -1 && paymentMethod.details) {
//         var klarnaContainer = document.createElement("div");
//         $(klarnaContainer).addClass('additionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
//         klarnaComponent = checkout.create('klarna', {
//             countryCode: $('#currentLocale').val(),
//             details: filterOutOpenInvoiceComponentDetails(paymentMethod.details),
//             visibility: {
//                 personalDetails: "editable"
//             }
//         });
//         klarnaComponent.mount(klarnaContainer);
//
//         if (isNordicCountry($('#shippingCountry').val())) {
//             var ssnContainer = document.createElement("div");
//             $(ssnContainer).attr('id', 'ssn_' + paymentMethod.type);
//             var socialSecurityNumberLabel = document.createElement("span");
//             $(socialSecurityNumberLabel).text("Social Security Number").attr('class', 'adyen-checkout__label');
//             var socialSecurityNumber = document.createElement("input");
//             $(socialSecurityNumber).attr('id', 'ssnValue').attr('class', 'adyen-checkout__input').attr('type', 'text'); //.attr('maxlength', ssnLength);
//
//             ssnContainer.append(socialSecurityNumberLabel);
//             ssnContainer.append(socialSecurityNumber);
//             klarnaContainer.append(ssnContainer);
//         }
//
//         li.append(klarnaContainer);
//
//     }
//     ;
//
//     if (paymentMethod.type.indexOf("afterpay_default") !== -1) {
//         var afterpayContainer = document.createElement("div");
//         $(afterpayContainer).addClass('additionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
//         afterpayComponent = checkout.create('afterpay', {
//             countryCode: $('#currentLocale').val(),
//             details: filterOutOpenInvoiceComponentDetails(paymentMethod.details),
//             visibility: {
//                 personalDetails: "editable"
//             }
//         });
//         li.append(afterpayContainer);
//         afterpayComponent.mount(afterpayContainer);
//     }
//     ;
//
//     if (paymentMethod.type == 'ratepay') {
//         var ratepayContainer = document.createElement("div");
//         $(ratepayContainer).addClass('additionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
//
//         var genderLabel = document.createElement("span");
//         $(genderLabel).text("Gender").attr('class', 'adyen-checkout__label');
//         var genderInput = document.createElement("select");
//         $(genderInput).attr('id', 'genderInput').attr('class', 'adyen-checkout__input');
//
//         //Create array of options to be added
//         var genders = {'M': 'Male','F': 'Female'};
//
//         for (var key in genders) {
//             var option = document.createElement("option");
//             option.value = key;
//             option.text = genders[key];
//             genderInput.appendChild(option);
//         }
//
//         var dateOfBirthLabel = document.createElement("span");
//         $(dateOfBirthLabel).text("Date of birth").attr('class', 'adyen-checkout__label');
//         var dateOfBirthInput = document.createElement("input");
//         $(dateOfBirthInput).attr('id', 'dateOfBirthInput').attr('class', 'adyen-checkout__input').attr('type', 'date');
//
//
//         ratepayContainer.append(genderLabel);
//         ratepayContainer.append(genderInput);
//         ratepayContainer.append(dateOfBirthLabel);
//         ratepayContainer.append(dateOfBirthInput);
//
//         li.append(ratepayContainer);
//     }
//     ;
//
//     if (paymentMethod.type.substring(0, 3) == "ach") {
//         var achContainer = document.createElement("div");
//         $(achContainer).addClass('additionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
//
//         var bankAccountOwnerNameLabel = document.createElement("span");
//         $(bankAccountOwnerNameLabel).text("Bank Account Owner Name").attr('class', 'adyen-checkout__label');
//         var bankAccountOwnerName = document.createElement("input");
//         $(bankAccountOwnerName).attr('id', 'bankAccountOwnerNameValue').attr('class', 'adyen-checkout__input').attr('type', 'text');
//
//         var bankAccountNumberLabel = document.createElement("span");
//         $(bankAccountNumberLabel).text("Bank Account Number").attr('class', 'adyen-checkout__label');
//         var bankAccountNumber = document.createElement("input");
//         $(bankAccountNumber).attr('id', 'bankAccountNumberValue').attr('class', 'adyen-checkout__input').attr('type', 'text').attr('maxlength', 17);
//
//         var bankLocationIdLabel = document.createElement("span");
//         $(bankLocationIdLabel).text("Routing Number").attr('class', 'adyen-checkout__label');
//         var bankLocationId = document.createElement("input");
//         $(bankLocationId).attr('id', 'bankLocationIdValue').attr('class', 'adyen-checkout__input').attr('type', 'text').attr('maxlength', 9);
//
//
//         achContainer.append(bankAccountOwnerNameLabel);
//         achContainer.append(bankAccountOwnerName);
//
//         achContainer.append(bankAccountNumberLabel);
//         achContainer.append(bankAccountNumber);
//
//         achContainer.append(bankLocationIdLabel);
//         achContainer.append(bankLocationId);
//
//         li.append(achContainer);
//     }
//
//     if (paymentMethod.details) {
//         if (paymentMethod.details.constructor == Array && paymentMethod.details[0].key == "issuer") {
//             var additionalFields = $('<div>').addClass('additionalFields')
//                 .attr('id', 'component_' + paymentMethod.type)
//                 .attr('style', 'display:none');
//
//             var issuers = $('<select>').attr('id', 'issuerList');
//             jQuery.each(paymentMethod.details[0].items, function (i, issuer) {
//                 var issuerOption = $('<option>')
//                     .attr('label', issuer.name)
//                     .attr('value', issuer.id);
//                 issuers.append(issuerOption);
//             });
//             additionalFields.append(issuers);
//             li.append(additionalFields);
//         }
//     }
//     $('#paymentMethodsUl').append(li);
// };


// //Filter fields for open invoice validation
// function filterOutOpenInvoiceComponentDetails(details) {
//     var filteredDetails = details.map(function (detail) {
//         if (detail.key == "personalDetails") {
//             var detailObject = detail.details.map(function (childDetail) {
//                 if (childDetail.key == 'dateOfBirth' ||
//                     childDetail.key == 'gender') {
//                     return childDetail;
//                 }
//             });
//
//             if (!!detailObject) {
//                 return {
//                     "key": detail.key,
//                     "type": detail.type,
//                     "details": filterUndefinedItemsInArray(detailObject)
//                 };
//             }
//         }
//     });
//
//     return filterUndefinedItemsInArray(filteredDetails);
// };
//
// /**
//  * Helper function to filter out the undefined items from an array
//  * @param arr
//  * @returns {*}
//  */
// function filterUndefinedItemsInArray(arr) {
//     return arr.filter(function (item) {
//         return typeof item !== 'undefined';
//     });
// };
//
// function isNordicCountry(country) {
//     if (country === "SE" || country === "FI" || country === "DK" || country === "NO") {
//         return true;
//     }
//     return false;
// };

//
// function checkComponentDetails(selectedMethod) {
//     //set data from components
//     if (selectedMethod.val() == "ideal") {
//         if (idealComponent.componentRef.state.isValid) {
//             $('#selectedIssuer').val(idealComponent.componentRef.state.data.issuer);
//             $('#adyenIssuerName').val(idealComponent.componentRef.props.items.find(x => x.id == idealComponent.componentRef.state.data.issuer).name);
//         }
//         return idealComponent.componentRef.state.isValid;
//     } else if (selectedMethod.val().indexOf("klarna") > -1 && klarnaComponent) {
//         if (klarnaComponent.componentRef.state.isValid) {
//             setOpenInvoiceData(klarnaComponent);
//             if ($('#ssnValue')) {
//                 $('#socialSecurityNumber').val($('#ssnValue').val());
//             }
//         }
//         return klarnaComponent.componentRef.state.isValid;
//     } else if (selectedMethod.val().indexOf("afterpay_default") > -1) {
//         if (afterpayComponent.componentRef.state.isValid) {
//             setOpenInvoiceData(afterpayComponent);
//         }
//         return afterpayComponent.componentRef.state.isValid;
//     }
//     else if (selectedMethod.val() == 'ratepay') {
//         if ($('#genderInput').val() && $('#dateOfBirthInput').val()) {
//             $('#gender').val($('#genderInput').val());
//             $('#dateOfBirth').val($('#dateOfBirthInput').val());
//             return true;
//         }
//
//         return false;
//     }
//     //if issuer is selected
//     else if (selectedMethod.closest('li').find('.additionalFields #issuerList').val()) {
//         $('#selectedIssuer').val(selectedMethod.closest('li').find('.additionalFields #issuerList').val());
//         $('#adyenIssuerName').val(selectedMethod.closest('li').find('.additionalFields #issuerList').find('option:selected').attr('label'));
//     } else if (selectedMethod.val().substring(0, 3) == "ach") {
//         $('#bankAccountOwnerName').val($('#bankAccountOwnerNameValue').val());
//         $('#bankAccountNumber').val($('#bankAccountNumberValue').val());
//         $('#bankLocationId').val($('#bankLocationIdValue').val());
//
//         if (!$('#bankLocationIdValue').val() || !$('#bankAccountNumberValue').val() || !$('#bankAccountOwnerNameValue').val()) {
//             return false;
//         }
//     }
//
//     return true;
// }
//
// function setOpenInvoiceData(component) {
//     if(component.componentRef.state.data.personalDetails){
//         if(component.componentRef.state.data.personalDetails.dateOfBirth){
//             $('#dateOfBirth').val(component.componentRef.state.data.personalDetails.dateOfBirth);
//         }
//         if(component.componentRef.state.data.personalDetails.gender){
//             $('#gender').val(component.componentRef.state.data.personalDetails.gender);
//         }
//         if(component.componentRef.state.data.personalDetails.telephoneNumber){
//             $('#telephoneNumber').val(component.componentRef.state.data.personalDetails.telephoneNumber);
//         }
//     }
// }
//
// function adyenPaymentMethodSelected(selectedMethod) {
//     if (!selectedMethod) {
//         return false;
//     }
//     return true;
// }
//
// $('button[value="add-new-payment"]').on('click', function (e) {
//     setPaymentData();
// });
//
// function setPaymentData() {
//     $('#adyenEncryptedCardNumber').val(card.state.data.encryptedCardNumber);
//     $('#adyenEncryptedExpiryMonth').val(card.state.data.encryptedExpiryMonth);
//     $('#adyenEncryptedExpiryYear').val(card.state.data.encryptedExpiryYear);
//     $('#adyenEncryptedSecurityCode').val(card.state.data.encryptedSecurityCode);
//     $('#cardOwner').val(card.state.data.holderName);
//     $('#cardNumber').val(maskedCardNumber || "");
//     $('#saveCardAdyen').val(storeDetails || false);
// }


module.exports = {
    methods: {
        renderGenericComponent: renderGenericComponent
    }
};
