    const configuration = {
        locale: $('#currentLocale').val(), // Defaults to en_US
        translations: {} // Override translations
    };

    const checkout = new AdyenCheckout(configuration);
    const cardNode = document.getElementById('card');
    var oneClickCard = [];
    var card;
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
                    $('.hppAdditionalFields').hide();
                    $('#extraFields_' + $(this).val()).show();
                });
            });
        }
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

        var additionalFields = $('<div>').addClass('hppAdditionalFields')
            .attr('id', 'extraFields_' + paymentMethod.type)
            .attr('style', 'display:none');

        if (paymentMethod.details) {
            if(paymentMethod.details.constructor == Array && paymentMethod.details[0].key == "issuer")
            {
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

    $('button[value="submit-payment"]').on('click', function (e) {
        if($('#selectedPaymentOption').val() == 'CREDIT_CARD' && $('.payment-information').data('is-new-payment')) {
            if(!isValid){
                return false;
            }
            else {
                $('#selectedCardID').val('');
                $('#adyenEncryptedCardNumber').val(card.paymentData.encryptedCardNumber);
                $('#adyenEncryptedExpiryMonth').val(card.paymentData.encryptedExpiryMonth);
                $('#adyenEncryptedExpiryYear').val(card.paymentData.encryptedExpiryYear);
                $('#adyenEncryptedSecurityCode').val(card.paymentData.encryptedSecurityCode);
            }
        }
        else if($('#selectedPaymentOption').val() == 'CREDIT_CARD' && !$('.payment-information').data('is-new-payment'))
        {
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
        else if($('#selectedPaymentOption').val() == 'Adyen' && $('#directoryLookup').val() == 'true' && !$("input[name='brandCode']:checked").val()) {
            $('#requiredBrandCode').show();
            return false;
        }
        else if ($('#selectedPaymentOption').val() == 'Adyen' && $("input[name='brandCode']:checked").val()) {
            $('#adyenPaymentMethod').val($("input[name='brandCode']:checked").closest(".paymentMethod").find("label").text());
            if ($("input[name='brandCode']:checked").parent().find('#issuerList').length) {
                $('#adyenIssuerName').val($("input[name='brandCode']:checked").parent().find('#issuerList :selected').attr('label'));
                $('#selectedIssuer').val($("input[name='brandCode']:checked").parent().find('#issuerList :selected').attr('value'));
            }
            else {
                $('#issuerList').val("");
                $('#adyenIssuerName').val("");
                $('#selectedIssuer').val("");
            }
        }
    });



