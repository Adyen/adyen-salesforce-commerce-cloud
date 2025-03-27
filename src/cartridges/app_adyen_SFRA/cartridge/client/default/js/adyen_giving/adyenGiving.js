const { httpClient } = require('../commons/httpClient');
const store = require('../../../../store');

let checkout;
let adyenGivingComponent;
const adyenGivingNode = document.getElementById('donate-container');
const orderTotal = window.givingConfig.orderTotal.replace(/[^0-9.]/g, '');
const {
  donationProperties,
  nonprofitName,
  nonprofitDescription,
  nonprofitUrl,
  logoUrl,
  bannerUrl,
  termsAndConditionsUrl,
} = window.givingConfig;

async function handleOnDonate(state, component) {
  if (!state.isValid) {
    return;
  }
  const selectedAmount = state.data.amount;
  const donationData = {
    amountValue: selectedAmount.value,
    amountCurrency: selectedAmount.currency,
    orderNo: window.givingConfig.orderNo,
    orderToken: window.givingConfig.orderToken,
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

function getDonationProperties() {
  try {
    return JSON.parse(donationProperties);
  } catch (e) {
    return [];
  }
}

function isRoundupDonation(data) {
  return data?.type === 'roundup';
}

const donationConfig = {
  donation: getDonationProperties(),
  nonprofitName,
  nonprofitDescription,
  nonprofitUrl,
  logoUrl,
  bannerUrl,
  termsAndConditionsUrl,
  showCancelButton: true,
  onDonate: handleOnDonate,
  onCancel: handleOnCancel,
  ...(isRoundupDonation(getDonationProperties()) && {
    commercialTxAmount: orderTotal,
  }),
};

store.checkoutConfiguration = {
  ...window.Configuration,
  countryCode: window.countryCode,
};

async function initializeGivingComponent() {
  checkout = await window.AdyenWeb.AdyenCheckout(store.checkoutConfiguration);
  adyenGivingComponent = window.AdyenWeb.createComponent(
    'donation',
    checkout,
    donationConfig,
  );
  adyenGivingComponent.mount(adyenGivingNode);
}

(async () => {
  await initializeGivingComponent();
})();

module.exports = {
  initializeGivingComponent,
};
