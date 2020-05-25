var bundle = require('./bundle');

var isValid = false;
var maskedCardNumber;
var MASKED_CC_PREFIX = '************';
var selectedMethod;
var componentArr = [];
var checkoutConfiguration;
var paymentMethodsResponse;
var checkout;
/**
 * @function
 * @description Initializes Adyen Secured Fields  Billing events
 */
function initializeBillingEvents() {
    $('#billing-submit').on('click', function (e) {
        var adyenPaymentMethod = document.querySelector("#adyenPaymentMethodName");
        var paymentMethodLabel = document.querySelector(`#lb_${selectedMethod}`).innerHTML;
        adyenPaymentMethod.value = paymentMethodLabel;

        validateComponents();

        return showValidation();
    });

    if (window.getPaymentMethodsResponse) {
        paymentMethodsResponse = window.getPaymentMethodsResponse;
        checkoutConfiguration = window.Configuration;
        checkoutConfiguration.onChange = function (state, component) {
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
                    if (componentName === selectedMethod) {
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
            },
            paypal: {
                intent: "capture",
                onSubmit: (state, component) => {
                    assignPaymentMethodValue();
                    makePaypalPayment(state.data, component);
                    document.querySelector("#adyenStateData").value = JSON.stringify(state.data);
                },
                onCancel: (data, component) => {
                    component.setStatus('ready');
                    makePaypalPayment({cancelPaypal: true}, component);
                },
                onError: (error, component) => {
                    component && component.setStatus('ready');
                },
                onAdditionalDetails: (state, component) => {
                    document.querySelector("#paypalStateData").value = JSON.stringify(state.data);
                    $('#dwfrm_billing').trigger('submit');
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
        renderGenericComponent();
    }
}

/**
 * @function
 * @description Initializes Adyen Checkout My Account events
 */
function initializeAccountEvents() {
    $('#add-card-submit').on('click', function (e) {
        e.preventDefault();
        if (window.AdyenCard.isValid) {
            copyCardData(window.AdyenCard);
            $('#add-card-submit-hidden').trigger('click');
        }
    });
}

function assignPaymentMethodValue() {
    var adyenPaymentMethod = document.querySelector("#adyenPaymentMethodName");
    adyenPaymentMethod.value = document.querySelector(`#lb_${selectedMethod}`).innerHTML;
}

function displaySelectedMethod(type) {
    selectedMethod = type;
    resetPaymentMethod();
    if(type !== "paypal") {
        document.querySelector(`#component_${type}`).setAttribute('style', 'display:block');
        document.querySelector('#billing-submit').disabled = false;
        if (document.querySelector(`#continueBtn`)) {
            document.querySelector(`#continueBtn`).setAttribute('style', 'display:none');
        }
    }
    else {
        document.querySelector('#billing-submit').disabled = true;
        document.querySelector(`#continueBtn`).setAttribute('style', 'display:block');
    }
}

function resetPaymentMethod() {
    $('.additionalFields').hide();
};

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
        for(var i = 0; i < inputs.length; i++) {
            inputs[i].classList.add('adyen-checkout__input--error');
        }
        if(inputs.length) {
            return false;
        }
    } else if(selectedMethod === "ratepay") {
        var input = document.querySelector("#dateOfBirthInput");
        if (!(input.value && input.value.length > 0)) {
            input.classList.add('adyen-checkout__input--error');
            return false;
        }
    }
    return true;
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

function validateCustomInputField(input) {
    if(input.value === "")
        input.classList.add('adyen-checkout__input--error');
    else if(input.value.length > 0) {
        input.classList.remove('adyen-checkout__input--error');
    }
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

function renderGenericComponent() {
    checkoutConfiguration.paymentMethodsResponse = paymentMethodsResponse.adyenPaymentMethods;
    checkout = new AdyenCheckout(checkoutConfiguration);
    var paymentMethods = paymentMethodsResponse.adyenPaymentMethods;
    if(paymentMethodsResponse.amount) {
        checkoutConfiguration.amount = paymentMethodsResponse.amount;
    }
    if(paymentMethodsResponse.countryCode) {
        checkoutConfiguration.countryCode = paymentMethodsResponse.countryCode;
    }
    document.querySelector("#paymentMethodsList").innerHTML = "";

    if(paymentMethods.storedPaymentMethods) {
        for (var i = 0; i < checkout.paymentMethodsResponse.storedPaymentMethods.length; i++) {
            var paymentMethod = checkout.paymentMethodsResponse.storedPaymentMethods[i];
            if(paymentMethod.supportedShopperInteractions.includes("Ecommerce"))
                renderPaymentMethod(paymentMethod,true, paymentMethodsResponse.ImagePath);
        }
    }

    for (var i = 0; i < paymentMethods.paymentMethods.length; i++) {
        var paymentMethod = paymentMethods.paymentMethods[i];
        renderPaymentMethod(paymentMethod,false, paymentMethodsResponse.ImagePath);
    }
    var firstPaymentMethod = document.querySelector('input[type=radio][name=brandCode]');
    firstPaymentMethod.checked = true;
    displaySelectedMethod(firstPaymentMethod.value);
}

function renderPaymentMethod(paymentMethod, storedPaymentMethodBool, path) {
    var paymentMethodsUI = document.querySelector('#paymentMethodsList');
    var li = document.createElement('li');
    var paymentMethodID = storedPaymentMethodBool? `storedCard${paymentMethod.id}` : paymentMethod.type;
    var imagePath = `${path}${storedPaymentMethodBool ? paymentMethod.brand : paymentMethod.type}.png`;
    var label = storedPaymentMethodBool? `${paymentMethod.name} ${MASKED_CC_PREFIX}${paymentMethod.lastFour}` : `${paymentMethod.name}`;
    var liContents = `
                              <input name="brandCode" type="radio" value="${paymentMethodID}" id="rb_${paymentMethodID}">
                              <img class="paymentMethod_img" src="${imagePath}" ></img>
                              <label id="lb_${paymentMethodID}" for="rb_${paymentMethodID}" style="float: none; width: 100%; display: inline; text-align: inherit">${label}</label>
                             `;
    var container = document.createElement("div");

    li.innerHTML = liContents;
    li.classList.add('paymentMethod');

    if(storedPaymentMethodBool) {
        setTimeout(function () {
            try {
                var node = checkout.create("card", paymentMethod).mount(container);
                componentArr[paymentMethodID] = node;

            } catch (e) {}
        }, 0);
    } else {
        var fallback = getFallback(paymentMethod.type);
        if(fallback) {
            var template = document.createElement("template");
            template.innerHTML = fallback;
            container.append(template.content);
        } else {
            if(paymentMethod.type === 'paypal') {
                var continueBtn = document.createElement('button');
                continueBtn.innerText = "continue";
                continueBtn.setAttribute("id", "continueBtn");
                continueBtn.setAttribute("style", "display:none");
                continueBtn.onclick = function() {
                    $('#dwfrm_billing').trigger('submit');
                };
                li.append(continueBtn);
            }
            setTimeout(function () {
                try {
                    var node = checkout.create(paymentMethod.type).mount(container);
                    componentArr[paymentMethodID] = node;
                } catch (e) {}
            }, 0);
        }
    }

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

function makePaypalPayment(data, component) {
    $.ajax({
        url: 'Adyen-PaymentFromComponent',
        type: 'post',
        data: JSON.stringify(data),
        contentType: "application/; charset=utf-8",
        success: function (data) {
            if(data.result && data.result.fullResponse) {
                component.handleAction(data.result.fullResponse.action)
            }
        }
    })
        .fail(function(xhr, textStatus) {})
}

$("#dwfrm_billing").submit(function(e) {
    if(selectedMethod === "paypal" && !document.querySelector("#paypalStateData").value) {
        e.preventDefault();
        var form = $(this);
        var url = form.attr('action');

        $.ajax({
            type: "POST",
            url: url,
            data: form.serialize(),
            success: function (data) {
                if(data.error) {
                    return
                }
                document.querySelector("#continueBtn").setAttribute("style", "display:none");
                document.querySelector("#component_paypal").setAttribute("style", "display:block");
            }
        });

    }
});

/**
 * @function
 * @description Initializes Adyen CSE billing events
 */

exports.initBilling = function() {
    initializeBillingEvents();
};

exports.initAccount = function() {
    initializeAccountEvents();
};

exports.renderGenericComponent = function() {
    renderGenericComponent();
}
