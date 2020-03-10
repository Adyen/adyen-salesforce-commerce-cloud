const checkout = new AdyenCheckout(window.Configuration);
const cardNode = document.getElementById('card');
var oneClickCard = [];
var card;
var idealComponent;
var afterpayComponent;
var klarnaComponent;
var isValid = false;
var storeDetails;
var maskedCardNumber;
const MASKED_CC_PREFIX = '************';
var oneClickValid = false;

renderOneClickComponents();
renderGenericComponent();

function displaySelectedMethod(type) {
    console.log('triggered');
    resetPaymentMethod();
    console.log(type);
    document.querySelector(`#component_${type}`).setAttribute('style', 'display:block');
}

function renderGenericComponent() {
    getPaymentMethods(async function (data) {
        var paymentMethodsResponse = JSON.stringify(data.AdyenPaymentMethods);
        console.log(data);
        var scripts = `
              <script type="module" src="https://unpkg.com/generic-component@0.0.25/dist/adyen-checkout/adyen-checkout.esm.js"></script>
              <script nomodule src="https://unpkg.com/generic-component@0.0.25/dist/adyen-checkout/adyen-checkout.js"></script>
           `;

        var componentNode = ` 
                         <adyen-checkout 
                                locale="${window.Configuration.locale}"
                                environment="${window.Configuration.environment}"
                                origin-key="${window.Configuration.originKey}"
                                payment-methods='${paymentMethodsResponse}'
                         >
                            <ul id="paymentMethodsList"></ul>   
                         </adyen-checkout>`;

        $('head').append(scripts);
        $('#adyen-webcomponent').append(componentNode);
        var adyenWebComponent = document.querySelector('adyen-checkout');
        var paymentMethodsUI = document.querySelector('#paymentMethodsList');

        for (var i = 0; i < data.AdyenPaymentMethods.paymentMethods.length; i++) {
            var paymentMethod = data.AdyenPaymentMethods.paymentMethods[i];
            console.log(paymentMethod);
            var li = document.createElement('li');
            li.classList.add('paymentMethod');
            var liContents = `
                                  <input name="brandCode" type="radio" value="${paymentMethod.type}" id="rb_${paymentMethod.type}" /> 
                                  <img class="paymentMethod_img" src="${data.ImagePath}${paymentMethod.type}.png" ></img>
                                  <label for="rb_${paymentMethod.name}">${paymentMethod.name}</label>
                                  <p>${data.AdyenDescriptions[i].description}</p>
                             `;
            li.innerHTML = liContents;

            // <div class="additionalFields" id="component_${paymentMethod.type}" style="display:none">

            // var li = $('<li>').addClass('paymentMethod');
            // li.append($('<input>')
            //     .attr('id', 'rb_' + paymentMethod.name)
            //     .attr('type', 'radio')
            //     .attr('name', 'brandCode')
            //     .attr('value', paymentMethod.type));
            // li.append($('<img>').addClass('paymentMethod_img').attr('src', data.imagePath + paymentMethod.name + '.png'));
            // li.append($('<label>').text(paymentMethod.name).attr('for', 'rb_' + paymentMethod.type));
            // li.append($('<p>').text(data.AdyenDescriptions[i].description));


            // -----
            // <adyen-payment-method type=${pm.type}>
            //     ${pm.type === 'ach' ? '<h4 slot="fallback">ACH Fallback</h4>' : ''}
            // </adyen-payment-method>

            await customElements.whenDefined('adyen-checkout').then(async () => {
                await adyenWebComponent.isAvailable(paymentMethod.type).then(isAvailable => {
                    var template = document.createElement('template');
                    var node;
                    console.log(paymentMethod.type);
                    if (isAvailable) {
                        node = `<adyen-payment-method-${paymentMethod.type}></adyen-payment-method->`;
                    } else {
                        const fallback = getFallback(paymentMethod.type);
                        node = `<adyen-payment-method-generic type=${paymentMethod.type}>${fallback || ''}</adyen-payment-method-generic>`;
                    }
                    // template.innerHTML = node;
                    var container = document.createElement('div');
                    container.classList.add("additionalFields");
                    container.setAttribute("id", `component_${paymentMethod.type}`);
                    console.log(paymentMethod.type);
                    container.setAttribute("style", "display:none");
                    container.innerHTML = node;

                    li.append(container);
                    // li.append(template.content);
                    // var x = document.createElement('li');
                    // x.innerHTML = node;
                    paymentMethodsUI.append(li);
                    // adyenWebComponent.append(li);
                    var input = document.querySelector(`#rb_${paymentMethod.type}`);
                    input.onchange = function () {
                        console.log(paymentMethod.type);
                        displaySelectedMethod(paymentMethod.type)
                    };
                });
            });

        }

        adyenWebComponent.addEventListener('adyenChange', adyenOnChange);
        adyenWebComponent.addEventListener('adyenBrand', adyenOnBrand);
        adyenWebComponent.addEventListener('adyenFieldValid', adyenOnFieldValid);
    });
}

function adyenOnChange(response) {
    var stateData = response.detail.state.data;
    $("#adyenStateData").val(JSON.stringify(stateData));
    isValid = response.detail.state.isValid;
}

function adyenOnBrand(response) {
    var brand = response.detail.state.brand;
    $("#cardType").val(brand);
}

function adyenOnFieldValid(response) {
    if(response.detail.state.endDigits){
        var endDigits = response.detail.state.endDigits;
        var maskedCardNumber = MASKED_CC_PREFIX + endDigits;
        $("#cardNumber").val(maskedCardNumber);
    }
}

function renderOneClickComponents() {
    var componentContainers = document.getElementsByClassName("cvc-container");
    jQuery.each(componentContainers, function (i, oneClickCardNode) {
        var container = document.getElementById(oneClickCardNode.id);
        var cardId = container.id.split("-")[1];
        var brandCode = document.getElementById('cardType-' + cardId).value;
        oneClickCard[cardId] = checkout.create('card', {
            // Specific for oneClick cards
            brand: brandCode,
            storedPaymentMethodId: cardId,
            onChange: function (state) {
                oneClickValid = state.isValid;
                if (state.isValid) {
                    $('#browserInfo').val(JSON.stringify(state.data.browserInfo));
                    $('#adyenEncryptedSecurityCode').val(state.data.paymentMethod.encryptedSecurityCode);
                }
            } // Gets triggered whenever a user changes input
        }).mount(container);
    });
};

$('.payment-summary .edit-button').on('click', function (e) {
    jQuery.each(oneClickCard, function (i) {
        oneClickCard[i].unmount();
    });
    renderOneClickComponents();
    oneClickValid = false;
});

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


//Filter fields for open invoice validation
function filterOutOpenInvoiceComponentDetails(details) {
    var filteredDetails = details.map(function (detail) {
        if (detail.key == "personalDetails") {
            var detailObject = detail.details.map(function (childDetail) {
                if (childDetail.key == 'dateOfBirth' ||
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
    if(!isValid){
        return false;
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
    } else if (selectedMethod.val().indexOf("klarna") > -1 && klarnaComponent) {
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
    else if (selectedMethod.val() == 'ratepay') {
        if ($('#genderInput').val() && $('#dateOfBirthInput').val()) {
            $('#gender').val($('#genderInput').val());
            $('#dateOfBirth').val($('#dateOfBirthInput').val());
            return true;
        }

        return false;
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
    if (!selectedMethod) {
        return false;
    }
    return true;
}

$('button[value="add-new-payment"]').on('click', function (e) {
    setPaymentData();
});

function setPaymentData() {
    $('#adyenEncryptedCardNumber').val(card.state.data.encryptedCardNumber);
    $('#adyenEncryptedExpiryMonth').val(card.state.data.encryptedExpiryMonth);
    $('#adyenEncryptedExpiryYear').val(card.state.data.encryptedExpiryYear);
    $('#adyenEncryptedSecurityCode').val(card.state.data.encryptedSecurityCode);
    $('#cardOwner').val(card.state.data.holderName);
    $('#cardNumber').val(maskedCardNumber || "");
    $('#saveCardAdyen').val(storeDetails || false);
}

function getFallback(paymentMethod) {
   var ach =  `<div slot="fallback">
                    <span class="adyen-checkout__label">Bank Account Owner Name</span>
                    <input type="text" id="bankAccountOwnerNameValue" class="adyen-checkout__input">
                    <span class="adyen-checkout__label">Bank Account Number</span>
                    <input type="text" id="bankAccountNumberValue" class="adyen-checkout__input" maxlength="17">
                    <span class="adyen-checkout__label">Routing Number</span>
                    <input type="text" id="bankLocationIdValue" class="adyen-checkout__input" maxlength="9">
                 </div>`;
   var fallback = {ach: ach};
   return fallback[paymentMethod];
}

module.exports = {
    methods: {
        displayPaymentMethods: displayPaymentMethods
    }
};

