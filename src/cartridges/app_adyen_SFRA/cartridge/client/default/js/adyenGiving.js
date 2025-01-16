const adyenGivingNode = document.getElementById('donate-container');

function handleOnDonate(state, component) {
  if (!state.isValid) {
    return;
  }
  const selectedAmount = state.data.amount;
  const donationData = {
    amountValue: selectedAmount.value,
    amountCurrency: selectedAmount.currency,
    orderNo: window.orderNo,
    orderToken: window.orderToken,
    csrf_token: $('#adyen-token').val(),
  };

  $.ajax({
    url: window.donateURL,
    type: 'post',
    data: donationData,
    success() {
      component.setStatus('success');
    },
  });
}

function handleOnCancel(state, component) {
  const adyenGiving = document.getElementById('adyenGiving');
  adyenGiving.style.transition = 'all 3s ease-in-out';
  adyenGiving.style.display = 'none';
  component.unmount();
}

function getAmounts() {
  try {
    return JSON.parse(donationAmounts);
  } catch (e) {
    return [];
  }
}

const donationConfig = {
  amounts: getAmounts(),
  backgroundUrl: adyenGivingBackgroundUrl,
  description: decodeURI(charityDescription),
  logoUrl: adyenGivingLogoUrl,
  name: decodeURI(charityName),
  url: charityWebsite,
  showCancelButton: true,
  onDonate: handleOnDonate,
  onCancel: handleOnCancel,
};

AdyenCheckout(window.Configuration).then((checkout) => {
  checkout.create('donation', donationConfig).mount(adyenGivingNode);
});
