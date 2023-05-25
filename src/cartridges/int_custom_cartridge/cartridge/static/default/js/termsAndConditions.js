$(document).ready(function () { // eslint-disable-line
    $('body').on('checkout:updateCheckoutView', (e, data) => {
        const currentStage = window.location.search.substring(
            window.location.search.indexOf('=') + 1,
        );
        if (currentStage === "placeOrder") {
            $('body').trigger('checkout:disableButton', '.next-step-button button');
        }
      });
    $('input[name$="termsAndConditions"]').on('click', function (e) {
        $('input[name$="termsAndConditions"]').prop("checked", this.checked);
        if(this.checked) {
            $('body').trigger('checkout:enableButton', '.next-step-button button');
        } else {
            $('body').trigger('checkout:disableButton', '.next-step-button button');
        }
      });
  });