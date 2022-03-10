let donation;
function handleOnDonate(state, component) {
  if (!state.isValid) {
    return;
  }
  const selectedAmount = state.data.amount;
  const donationData = {
    amountValue: selectedAmount.value,
    amountCurrency: selectedAmount.currency,
    orderNo: window.orderNo,
    pspReference: window.pspReference,
  };
  $.ajax({
    url: window.donateURL,
    type: 'post',
    data: JSON.stringify(donationData),
    contentType: 'application/; charset=utf-8',
    success() {
      component.setStatus('success');
    },
  });
}

function handleOnCancel() {
  const adyenGiving = document.getElementById('adyenGiving');
  adyenGiving.style.transition = 'all 3s ease-in-out';
  adyenGiving.style.display = 'none';
  donation.unmount();
}

if (
  document.querySelector('.adyen-payment-details') &&
  window.adyenGivingAvailable
) {
  const adyenGivingNode = document.getElementById('donate-container');

  let amounts;
  try {
    amounts = JSON.parse(window.donationAmounts);
  } catch (e) {
    amounts = [];
  }

  const donationConfig = {
    amounts,
    backgroundUrl: window.adyenGivingBackgroundUrl,
    description: window.charityDescription,
    logoUrl: window.adyenGivingLogoUrl,
    name: window.charityName,
    url: window.charityWebsite,
    showCancelButton: true,
    onDonate: handleOnDonate,
    onCancel: handleOnCancel,
  };

  AdyenCheckout(window.Configuration).then((checkout) => {
    checkout.create('donation', donationConfig).mount(adyenGivingNode);
  });
}
