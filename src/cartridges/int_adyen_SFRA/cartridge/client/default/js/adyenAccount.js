const cardNode = document.getElementById("card");
let maskedCardNumber;
let isValid = false;
// let storeDetails;
let componentState;
const MASKED_CC_PREFIX = "************";
const checkoutConfiguration = window.Configuration;
checkoutConfiguration.paymentMethodsConfiguration = {
  card: {
    enableStoreDetails: false,
    hasHolderName: true,
    onBrand: function (brandObject) {
      $("#cardType").val(brandObject.brand);
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
    },
  },
};

const checkout = new AdyenCheckout(checkoutConfiguration);
const card = checkout.create("card").mount(cardNode);

$('button[value="add-new-payment"]').on("click", function () {
  if (isValid) {
    document.querySelector("#adyenStateData").value = JSON.stringify(
      componentState.data
    );
    return true;
  } else {
    card.showValidation();
    return false;
  }
});
