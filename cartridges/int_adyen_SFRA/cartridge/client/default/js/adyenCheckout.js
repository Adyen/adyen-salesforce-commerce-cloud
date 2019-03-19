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

    getConfigurationSecureFields();

    $(document).ready(function () {
        displayPaymentMethods();
    });

    var originKey = "";
    var loadingContext = "";

    function setConfigData(data, callback){
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
            onChange: function(state) {
                isValid = state.isValid;
            }, // Gets triggered whenever a user changes input
            onBrand: function(brandObject) {
                $('#cardType').val(brandObject.brand);
            }, // Called once we detect the card brand
            onBinValue: function(bin) {
                $('#cardNumber').val(bin.binValue);
            } // Provides the BIN Number of the card (up to 6 digits), called as the user types in the PAN
        });
        card.mount(cardNode);
    };

    var oneClickValid = false;
    function renderOneClickComponents() {
        var componentContainers = document.getElementsByClassName("cvc-container");
        jQuery.each(componentContainers, function(i, oneClickCardNode){
            var container = document.getElementById(oneClickCardNode.id);
            oneClickCard[i] = checkout.create('card', {
                //Get selected card, send in payment request
                    originKey: originKey,
                    loadingContext: loadingContext, // The environment where we should loads the secured fields from
                    // Specific for oneClick cards
                    details: [{"key":"cardDetails.cvc","type":"cvc"}], // <--- Pass the specific details for this paymentMethod
                    oneClick: true, //<--- enable oneClick 'mode'
                    storedDetails: {
                        "card": {
                            "expiryMonth": "",
                            "expiryYear": "",
                            "holderName": "",
                            "number": ""
                        }
                    },
                onChange: function(state) {
                    oneClickValid = state.isValid;
                    if(state.isValid){
                        $('#adyenEncryptedSecurityCode').val(state.data.encryptedSecurityCode);
                    }
                } // Gets triggered whenever a user changes input
            }).mount(container);
        });
    };

    function getConfigurationSecureFields() {
        $.ajax({
            url: 'Adyen-GetConfigSecuredFields',
            type: 'get',
            data: {protocol : window.location.protocol},
            success: function (data) {
                if(!data.error){
                    setConfigData(data, function() {
                        renderCardComponent();
                        renderOneClickComponents();
                    });
                }
                else {
                    $('#errorLoadComponent').text(data.errorMessage);
                }
            }
        });
    };

    $('.payment-summary .edit-button').on('click', function (e) {
        jQuery.each(oneClickCard, function(i) {
            oneClickCard[i].unmount();
        });
        renderOneClickComponents();
        oneClickValid = false;
    });

    $('button[value="submit-shipping"]').on('click', function (e) {
        displayPaymentMethods();
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

    function resetPaymentMethod(){
        $('#requiredBrandCode').hide();
        $('#selectedIssuer').val("");
        $('#adyenIssuerName').val("");
        $('#dateOfBirth').val("");
        $('#gender').val("");
        $('.hppAdditionalFields').hide();
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
            $(idealContainer).addClass('hppAdditionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
            idealComponent = checkout.create('ideal', {
                items: paymentMethod.details[0].items
            });
            li.append(idealContainer);
            idealComponent.mount(idealContainer);
        }

        if(paymentMethod.type.indexOf("klarna") !== -1){
            var klarnaContainer = document.createElement("div");
            $(klarnaContainer).addClass('hppAdditionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
            window.klarnaComponent = checkout.create('klarna', {
                countryCode: $('#currentLocale').val(),
                details: filterOutOpenInvoiceComponentDetails(paymentMethod.details),
                visibility: {
                    personalDetails: "editable"
                }
            });

            window.klarnaComponent.mount(klarnaContainer);

            var ssnLength = getSsnLengthNordicCountry($('#shippingCountry').val());
            if(ssnLength > 0){
                var ssnContainer = document.createElement("div");
                $(ssnContainer).attr('id', 'ssn_' + paymentMethod.type);
                var socialSecurityNumberLabel = document.createElement("span");
                $(socialSecurityNumberLabel).text("Social Security Number").attr('class', 'adyen-checkout__label');
                var socialSecurityNumber = document.createElement("input");
                $(socialSecurityNumber).attr('id', 'ssnValue').attr('class', 'adyen-checkout__input').attr('type', 'text').attr('maxlength', ssnLength);

                ssnContainer.append(socialSecurityNumberLabel);
                ssnContainer.append(socialSecurityNumber);
                klarnaContainer.append(ssnContainer);
            }

            li.append(klarnaContainer);

        };

        if(paymentMethod.type.indexOf("afterpay_default") !== -1){
            var afterpayContainer = document.createElement("div");
            $(afterpayContainer).addClass('hppAdditionalFields').attr('id', 'component_' + paymentMethod.type).attr('style', 'display:none');
            afterpayComponent = checkout.create('afterpay', {
                countryCode: $('#currentLocale').val(),
                details: filterOutOpenInvoiceComponentDetails(paymentMethod.details),
                visibility: {
                    personalDetails: "editable"
                }
            });
            li.append(afterpayContainer);
            afterpayComponent.mount(afterpayContainer);
        };

        $('#paymentMethodsUl').append(li);
    };


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

    function getSsnLengthNordicCountry(country){
        if(country === "NO" || country === "SE"|| country === "FI" || country === "DK"){
            if(country.indexOf("NO") > -1){
                return 5;
            }
            return 4;
        }
        return 0;
    };

    //Submit the payment
    $('button[value="submit-payment"]').on('click', function (e) {
        if($('#selectedPaymentOption').val() == 'CREDIT_CARD')
        {
            //new card payment
            if($('.payment-information').data('is-new-payment')){
                if(!isValid){
                    return false;
                }
                else {
                    $('#selectedCardID').val('');
                    setPaymentData();
                }
            }
            //oneclick payment
            else {
                var uuid = $('.selected-payment').data('uuid');
                if(!oneClickValid){
                    return false;
                }
                else {
                    var selectedCardType = document.getElementById('cardType-' + uuid).innerText;
                    document.getElementById('saved-payment-security-code-' + uuid).value = "000";
                    $('#cardType').val(selectedCardType)
                    $('#selectedCardID').val($('.selected-payment').data('uuid'));
                    return true;
                }
            }
        }
        else if($('#selectedPaymentOption').val() == 'Adyen'){
            var selectedMethod = $("input[name='brandCode']:checked").val();

            //no paymentmethod selected
            if(!adyenPaymentMethodSelected(selectedMethod)) {
                $('#requiredBrandCode').show();
                return false;
            }
            else {
                var componentState = checkComponentDetails(selectedMethod);
                $('#adyenPaymentMethod').val($("input[name='brandCode']:checked").attr('id').substr(3));
                return componentState;
            }
        }

        return true;
    });

    function checkComponentDetails(selectedMethod){
        //set data from components
        if(selectedMethod == "ideal"){
            if(idealComponent.componentRef.state.isValid){
                $('#selectedIssuer').val(idealComponent.componentRef.state.data.issuer);
                $('#adyenIssuerName').val(idealComponent.componentRef.props.items.find(x => x.id == idealComponent.componentRef.state.data.issuer).name);
            }
            return idealComponent.componentRef.state.isValid;
        }
        else if(selectedMethod.indexOf("klarna") > -1) {
            if(window.klarnaComponent.componentRef.state.isValid){
                setOpenInvoiceData(window.klarnaComponent);
                if($('#ssnValue')){
                    $('#socialSecurityNumber').val($('#ssnValue').val());
                }
            }
            return window.klarnaComponent.componentRef.state.isValid;
        }

        else if(selectedMethod.indexOf("afterpay_default") > -1) {
            if(afterpayComponent.componentRef.state.isValid){
                setOpenInvoiceData(afterpayComponent);
            }
            return afterpayComponent.componentRef.state.isValid;
        }
        return true;
    }

    function setOpenInvoiceData(component){
        $('#dateOfBirth').val(component.componentRef.state.data.personalDetails.dateOfBirth);
        $('#gender').val(component.componentRef.state.data.personalDetails.gender);
    }

    function adyenPaymentMethodSelected(selectedMethod){
        if($('#directoryLookup').val() == 'true') {
            if(!selectedMethod){
                return false;
            }
        }
        return true;
    }

    $('button[value="add-new-payment"]').on('click', function (e) {
        setPaymentData();
    });

    function setPaymentData(){
        $('#adyenEncryptedCardNumber').val(card.paymentData.encryptedCardNumber);
        $('#adyenEncryptedExpiryMonth').val(card.paymentData.encryptedExpiryMonth);
        $('#adyenEncryptedExpiryYear').val(card.paymentData.encryptedExpiryYear);
        $('#adyenEncryptedSecurityCode').val(card.paymentData.encryptedSecurityCode);
        $('#cardOwner').val(card.paymentData.holderName);
    }


