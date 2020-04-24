    var bundle = require('./bundle');

    var isValid = false;
    var storeDetails;
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

        paymentMethodsResponse = window.getPaymentMethodsResponse;
        checkoutConfiguration = window.Configuration;
        console.log(checkoutConfiguration);
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
            }
        };

        /*boletobancario: {
        personalDetailsRequired: true, // turn personalDetails section on/off
            billingAddressRequired: false, // turn billingAddress section on/off
            showEmailAddress: false, // allow shopper to specify their email address

            // Optionally prefill some fields, here all fields are filled:
            data: {
            socialSecurityNumber: '56861752509',
                firstName: document.getElementById("shippingFirstNamedefault").value,
                lastName: document.getElementById("shippingLastNamedefault").value
        }
    }*/
        // if(window.installments) {
        //     try {
        //         var installments = JSON.parse(window.installments);
        //         checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
        //     }
        //     catch (e) {}
        // }
        renderGenericComponent();
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

    function displaySelectedMethod(type) {
        selectedMethod = type;
        resetPaymentMethod();
        document.querySelector(`#component_${type}`).setAttribute('style', 'display:block');
    }

    function resetPaymentMethod() {
        // $('#requiredBrandCode').hide();
        // $('#selectedIssuer').val("");
        // $('#adyenIssuerName').val("");
        // $('#dateOfBirth').val("");
        // $('#telephoneNumber').val("");
        // $('#gender').val("");
        // $('#bankAccountOwnerName').val("");
        // $('#bankAccountNumber').val("");
        // $('#bankLocationId').val("");
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
            //todo Zaid/Bas installments
        // if(data.amount) {
            //     checkoutConfiguration.amount = data.amount;
            // }
            // if(data.countryCode) {
            //     checkoutConfiguration.countryCode = data.countryCode;
            // }
            document.querySelector("#paymentMethodsList").innerHTML = "";

            console.log(paymentMethods);
            if(paymentMethods.storedPaymentMethods) {
                for (var i = 0; i < checkout.paymentMethodsResponse.storedPaymentMethods.length; i++) {
                    var paymentMethod = checkout.paymentMethodsResponse.storedPaymentMethods[i];
                    if(paymentMethod.supportedShopperInteractions.includes("Ecommerce"))
                        renderPaymentMethod(paymentMethod,true, paymentMethodsResponse.ImagePath);
                }
            }

            for (var i = 0; i < paymentMethods.paymentMethods.length; i++) {
                var paymentMethod = paymentMethods.paymentMethods[i];
                renderPaymentMethod(paymentMethod,false, paymentMethodsResponse.ImagePath,
                    paymentMethodsResponse.AdyenDescriptions[i].description);
            }

            var firstPaymentMethod = document.querySelector('input[type=radio][name=brandCode]');
            firstPaymentMethod.checked = true;
            displaySelectedMethod(firstPaymentMethod.value);
    }

    function renderPaymentMethod(paymentMethod, storedPaymentMethodBool, path, description = null) {
        // var checkout = new AdyenCheckout(checkoutConfiguration);
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


