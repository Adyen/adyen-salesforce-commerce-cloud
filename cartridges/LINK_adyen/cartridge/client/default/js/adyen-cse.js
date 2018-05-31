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

});


