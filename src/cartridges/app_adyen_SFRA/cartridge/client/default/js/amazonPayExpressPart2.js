const { getPaymentMethods } = require('./commons');

function saveShopperDetails(details) {
  $.ajax({
    url: window.saveShopperDetailsURL,
    type: 'post',
    data: {
      csrf_token: $('#adyen-token').val(),
      shopperDetails: JSON.stringify(details),
      paymentMethod: 'amazonpay',
    },
    success(data) {
      const select = document.querySelector('#shippingMethods');
      select.innerHTML = '';
      data.shippingMethods.forEach((shippingMethod) => {
        const option = document.createElement('option');
        option.setAttribute('data-shipping-id', shippingMethod.ID);
        option.innerText = `${shippingMethod.displayName} (${shippingMethod.estimatedArrivalTime})`;
        select.appendChild(option);
      });
      select.options[0].selected = true;
      select.dispatchEvent(new Event('change'));
    },
  });
}

function constructAddress(shopperDetails) {
  const addressKeys = Object.keys(shopperDetails.shippingAddress);
  const addressValues = Object.values(shopperDetails.shippingAddress);
  let addressStr = `${shopperDetails.shippingAddress.name}\n`;
  for (let i = 0; i < addressKeys.length; i += 1) {
    if (addressValues[i] && addressKeys[i] !== 'name') {
      addressStr += `${addressValues[i]} `;
    }
  }
  return addressStr;
}

function positionElementBefore(elm, target) {
  const targetNode = document.querySelector(target);
  const addressDetails = document.querySelector(elm);
  if (targetNode && addressDetails) {
    targetNode.parentNode.insertBefore(addressDetails, targetNode);
  }
}

function wrapChangeAddressButton() {
  // hide component button and use custom "Edit" buttons instead
  const changeDetailsBtn = document.getElementsByClassName(
    'adyen-checkout__button adyen-checkout__button--ghost adyen-checkout__amazonpay__button--changeAddress',
  )[0];
  changeDetailsBtn.classList.add('invisible');
  const editAddressBtns = document.querySelectorAll('.editAddressBtn');
  editAddressBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      changeDetailsBtn.click();
    });
  });
}

function showAddressDetails(shopperDetails) {
  const addressText = constructAddress(shopperDetails);

  const addressElement = document.querySelector('#address');
  const paymentDiscriptorElement = document.querySelector('#paymentStr');
  addressElement.innerText = addressText;
  paymentDiscriptorElement.innerText = shopperDetails.paymentDescriptor;

  positionElementBefore('#amazonPayAddressDetails', '.coupons-and-promos');

  wrapChangeAddressButton();

  const payBtn = document.getElementsByClassName(
    'adyen-checkout__button adyen-checkout__button--standalone adyen-checkout__button--pay',
  )[0];
  payBtn.style.background = '#00a1e0';
}

async function mountAmazonPayComponent() {
  try {
    const amazonPayNode = document.getElementById('amazon-container');
    const paymentMethodsData = await getPaymentMethods();
    const paymentMethodsResponse = paymentMethodsData?.AdyenPaymentMethods;
    const applicationInfo = paymentMethodsData?.applicationInfo;
    const checkout = await AdyenCheckout({
      environment: window.Configuration.environment,
      clientKey: window.Configuration.clientKey,
      locale: window.Configuration.locale,
      analytics: {
        analyticsData: { applicationInfo },
      },
    });
    const amazonPayConfig = paymentMethodsResponse?.paymentMethods.find(
      (pm) => pm.type === 'amazonpay',
    )?.configuration;
    if (!amazonPayConfig) return;
    const amazonConfig = {
      showOrderButton: true,
      configuration: {
        merchantId: amazonPayConfig.merchantId,
        storeId: amazonPayConfig.storeId,
        region: amazonPayConfig.region,
        publicKeyId: amazonPayConfig.publicKeyId,
      },
      returnUrl: window.returnUrl,
      showChangePaymentDetailsButton: true,
      amount: JSON.parse(window.basketAmount),
      amazonCheckoutSessionId: window.amazonCheckoutSessionId,
    };
    const amazonPayComponent = checkout
      .create('amazonpay', amazonConfig)
      .mount(amazonPayNode);
    const shopperDetails = await amazonPayComponent.getShopperDetails();
    saveShopperDetails(shopperDetails);
    showAddressDetails(shopperDetails);
  } catch (e) {
    //
  }
}

mountAmazonPayComponent();

module.exports = {
  saveShopperDetails,
  constructAddress,
  positionElementBefore,
  wrapChangeAddressButton,
  showAddressDetails,
};
