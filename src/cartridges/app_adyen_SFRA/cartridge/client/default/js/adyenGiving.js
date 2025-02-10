const { httpClient } = require('./commons/httpClient');

const adyenGivingNode = document.getElementById('donate-container');

async function handleOnDonate(state, component) {
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

  try {
    await httpClient({
      method: 'POST',
      url: window.donateURL,
      data: donationData,
    });
    component.setStatus('success');
  } catch (error) {
    component.setStatus('error');
  }
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
