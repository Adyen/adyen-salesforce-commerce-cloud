var checkoutConfiguration = window.Configuration;
checkoutConfiguration.paymentMethodsConfiguration = {
    card: {
        enableStoreDetails: false,
        hasHolderName: true,
        onBrand: function (brandObject) {
            $('#cardType').val(brandObject.brand);
        },
        onFieldValid: function (data) {
            if (data.endDigits) {
                maskedCardNumber = MASKED_CC_PREFIX + data.endDigits;
                $("#cardNumber").val(maskedCardNumber);
            }
        },
        onChange: function (state) {
            storeDetails = state.data.storePaymentMethod;
            isValid = state.isValid;
            componentState = state;
        }
    }
}

var checkout = new AdyenCheckout(checkoutConfiguration);
var cardNode = document.getElementById("card");
var maskedCardNumber;
var isValid = false;
var storeDetails;
var componentState;
var MASKED_CC_PREFIX = "************";
var card;

(function () {
    card = checkout.create("card").mount(cardNode);
})();


$('button[value="add-new-payment"]').on('click', function (e) {
    if(isValid){
        document.querySelector("#adyenStateData").value = JSON.stringify(componentState.data);
        return true;
    }
    else {
        card.showValidation();
        return false;
    }
});