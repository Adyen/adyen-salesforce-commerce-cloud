// This script is executed only on the checkout summary page
if((window.location.pathname.includes('COBilling-Billing') || window.location.pathname.includes('Adyen-ShowConfirmation')) && window.isAdyenPayment) {

  // onAdditionalDetails event handler to be included in Adyen Component configuration
  var onAdditionalDetails = function (state) {
    $.ajax({
      type: 'POST',
      url: 'Adyen-PaymentsDetails',
      data: JSON.stringify(state.data),
      contentType: 'application/json; charset=utf-8',
      async: false,
      success(data) {
        if (!data.response.isFinal && typeof data.response.action === 'object') {
          window.Configuration.onAdditionalDetails = onAdditionalDetails;
          const checkout = new AdyenCheckout(window.Configuration);
          const actionContainer = document.getElementById('action-container');
          checkout.createFromAction(data.response.action).mount(actionContainer);
        } else {
          window.location.href = data.response.redirectUrl;
        }
      },
    });
  }

  // serializes form data and submits to place order. Then proceeds to handle the result
  function placeOrder(formId) {
    const form = $('#' + formId);
    $.ajax({
      method:'POST',
      url: window.summarySubmitUrl,
      data: $(form).serialize(),
      success: (data) => {
        if (data.action) {
          window.Configuration.onAdditionalDetails = onAdditionalDetails;
          const checkout = new AdyenCheckout(window.Configuration);
          const actionContainer = document.getElementById('action-container');
          document.getElementById('action-modal-SG').style.display = "block";
          checkout.createFromAction(data.action).mount(actionContainer);
        } else {
          window.location.href = data.continueUrl;
        }
      }
    });
  }

  window.addEventListener( "load", function () {
    // Override default submit form behavior
    const formId = 'submit-order-form';
    const form = document.getElementById(formId);
    form.addEventListener( "submit", function ( event ) {
      event.preventDefault();
      placeOrder(formId);
    } );
  });
}
