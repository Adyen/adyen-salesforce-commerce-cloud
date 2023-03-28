"use strict";

var donation;
function handleOnDonate(state, component) {
  if (!state.isValid) {
    return;
  }
  var selectedAmount = state.data.amount;
  var donationData = {
    amountValue: selectedAmount.value,
    amountCurrency: selectedAmount.currency,
    orderNo: window.orderNo,
    pspReference: window.pspReference
  };
  $.ajax({
    url: window.donateURL,
    type: 'post',
    data: JSON.stringify(donationData),
    contentType: 'application/; charset=utf-8',
    success: function success() {
      component.setStatus('success');
    }
  });
}
function handleOnCancel() {
  var adyenGiving = document.getElementById('adyenGiving');
  adyenGiving.style.transition = 'all 3s ease-in-out';
  adyenGiving.style.display = 'none';
  donation.unmount();
}
if (document.querySelector('.adyen-payment-details') && window.adyenGivingAvailable) {
  var adyenGivingNode = document.getElementById('donate-container');
  var amounts;
  try {
    amounts = JSON.parse(window.donationAmounts);
  } catch (e) {
    amounts = [];
  }
  var donationConfig = {
    amounts: amounts,
    backgroundUrl: window.adyenGivingBackgroundUrl,
    description: window.charityDescription,
    logoUrl: window.adyenGivingLogoUrl,
    name: window.charityName,
    url: window.charityWebsite,
    showCancelButton: true,
    onDonate: handleOnDonate,
    onCancel: handleOnCancel
  };
  AdyenCheckout(window.Configuration).then(function (checkout) {
    checkout.create('donation', donationConfig).mount(adyenGivingNode);
  });
}