var checkoutConfiguration = window.Configuration;
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
        onChange: function (state) {
            storeDetails = state.data.storePaymentMethod;
            isValid = state.isValid;
            stateData = state.data;
        }
    }
}

var checkout = new AdyenCheckout(checkoutConfiguration);
var cardNode = document.getElementById("card");
var maskedCardNumber;
var isValid = false;
var storeDetails;
var stateData;
var MASKED_CC_PREFIX = "************";

(function () {
    var card = checkout.create("card");
    card.mount(cardNode);
})();


$('button[value="add-new-payment"]').on('click', function (e) {
    document.querySelector("#adyenStateData").value = JSON.stringify(stateData);
});