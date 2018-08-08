$('button[value="submit-payment"]').on('click', function (e) {
    var encryptedData = $('#adyenEncryptedData'),
        encryptedDataValue,
        options = {};

    var cardData = {
        cvc : $('#securityCode').val(),
        expiryMonth : $('#expirationMonth').val(),
        expiryYear : $('#expirationYear').val(),
        generationtime : $('#adyen_generationtime').val(),
        number : $('#cardNumber').val(),
        holderName : $('#holderName').val()
    };

    var cseInstance = adyen.createEncryption(options);
    encryptedDataValue = cseInstance.encrypt(cardData);
    encryptedData.val(encryptedDataValue);
    $('#cardNumber').val("");
});

$('button[value="submit-shipping"]').on('click', function (e) {
    $('#paymentMethodsUl').empty();
    getPaymentMethods(function(data){
        jQuery.each(data.AdyenHppPaymentMethods.paymentMethods, function(i, method){
            addPaymentMethod(method);
        })
    });

});

function getPaymentMethods(paymentMethods){
    $.ajax({
        url: "Adyen-GetPaymentMethods",
        type: 'get',
        success: function (data) {
            paymentMethods(data);
        },
        error: function (err) {

        }
    });
};

function addPaymentMethod(paymentMethod){
    var pm = $('<li>').append($('<input>')
        .attr('type', 'radio')
        .attr('name', 'brandCode')
        .attr('value', paymentMethod.brandCode))
        //.append($('<img>').attr('src', '${URLUtils.staticURL("/images/' + paymentMethod.brandCode + '.png")}'))
        .append($('<label>').text(paymentMethod.name));

    $('#paymentMethodsUl').append(pm);
};


