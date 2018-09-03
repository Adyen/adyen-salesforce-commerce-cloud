$('button[value="submit-payment"]').on('click', function (e) {
    var cardData;
    var encryptedData = $('#adyenEncryptedData'),
        encryptedDataValue,
        options = {};

    if(!$('.payment-information').data('is-new-payment')) {
        $('#selectedCardID').val($('.selected-payment').data('uuid'));
        cardData = getCardData(true);
        options = { enableValidations: false};
    }
    else {
        $('#selectedCardID').val('');
        cardData = getCardData(false);
    }

    var cseInstance = adyen.createEncryption(options);
    encryptedDataValue = cseInstance.encrypt(cardData);
    encryptedData.val(encryptedDataValue);
    $('#cardNumber').val("");

    if($('#selectedPaymentOption').val() == "Adyen" && $('#directoryLookup').val() == "true" && !$("input[name='brandCode']:checked").val()) {
        $('#requiredBrandCode').show();
        return false;
    }
});

$('button[value="add-new-payment"]').on('click', function (e) {
    var encryptedData = $('#adyenEncryptedData'),
        encryptedDataValue,
        options = {};

    var cardData = {
        number: $('#cardNumber').val(),
        expiryMonth: $('#month').val(),
        expiryYear: $('#year').val(),
        generationtime: $('#adyen_generationtime').val(),
        holderName: $('#cardOwner').val(),
        cvc: $('#securityCode').val()
    }

    var cseInstance = adyen.createEncryption(options);
    encryptedDataValue = cseInstance.encrypt(cardData);
    encryptedData.val(encryptedDataValue);
    $('#cardNumber').val("");

});

function getCardData(selectedCard){
    var cardData = {
        expiryMonth: $('#expirationMonth').val(),
        expiryYear: $('#expirationYear').val(),
        generationtime: $('#adyen_generationtime').val()
    }
    if(!selectedCard){
        cardData.number = $('#cardNumber').val();
        cardData.holderName = $('#holderName').val();
        cardData.cvc = $('#securityCode').val();
    }
    else {
        cardData.cvc = $('.selected-payment #saved-payment-security-code').val();
    }
    return cardData;
}

$('button[value="submit-shipping"]').on('click', function (e) {
    displayPaymentMethods();
});

$(document).ready(function () {
    displayPaymentMethods();
});

function displayPaymentMethods() {
    $('#paymentMethodsUl').empty();
    if($('#directoryLookup').val() == "true"){
        getPaymentMethods(function(data){
            jQuery.each(data.AdyenHppPaymentMethods, function(i, method){
                addPaymentMethod(method, data.ImagePath);
            })

            $('input[type=radio][name=brandCode]').change(function(){
                $( ".hppAdditionalFields" ).hide();
                $('#extraFields_' + $(this).val()).show();
            })
        });
    }
}

function getPaymentMethods(paymentMethods){
    $.ajax({
        url: "Adyen-GetPaymentMethods",
        type: 'get',
        success: function (data) {
            paymentMethods(data);
        }
    });
};

function addPaymentMethod(paymentMethod, imagePath){
    var li = $('<li>').addClass("paymentMethod");
    li.append($('<input>')
        .attr('id', 'rb_' + paymentMethod.name)
        .attr('type', 'radio')
        .attr('name', 'brandCode')
        .attr('value', paymentMethod.brandCode));
    li.append($('<img>').addClass("paymentMethod_img").attr('src', imagePath + paymentMethod.brandCode + '.png'));
    li.append($('<label>').text(paymentMethod.name).attr('for', 'rb_' + paymentMethod.name));

    var additionalFields = $('<div>').addClass('hppAdditionalFields')
        .attr('id', 'extraFields_' + paymentMethod.brandCode)
        .attr('style', 'display:none');

        if(paymentMethod.issuers){
            var issuers = $('<select>').attr('name', 'issuerId');
            jQuery.each(paymentMethod.issuers, function(i, issuer){
               var issuer = $('<option>')
                   .attr('label', issuer.name)
                   .attr('value', issuer.issuerId)
                issuers.append(issuer);
            });
            additionalFields.append(issuers);
            li.append(additionalFields);
        }
        if($('#OpenInvoiceWhiteList').val().indexOf(paymentMethod.brandCode) !== -1){
            //Display Additional Open Invoice fields
            li.append(additionalFields);
        }
    $('#paymentMethodsUl').append(li);
};

