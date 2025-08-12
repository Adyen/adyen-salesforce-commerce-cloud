const { httpClient } = require('../../commons/httpClient');
const store = require('../../../../../../config/store');

function formatFastlaneAddress(shippingAddress) {
  const { name, address, phoneNumber } = shippingAddress;
  return {
    firstName: name?.firstName,
    lastName: name?.lastName,
    street: address?.addressLine1,
    city: address?.adminArea2,
    telephoneNumber: `${phoneNumber?.countryCode || ''}${phoneNumber?.nationalNumber || ''}`,
    postalCode: address?.postalCode,
    stateOrProvince: address?.adminArea1,
    country: address?.countryCode,
  };
}

function formatFastlaneTelephoneNumber(phones) {
  return phones?.length
    ? `${phones[0].countryCode || ''}${phones[0].nationalNumber || ''}`
    : null;
}

function getFastlaneShopperDetails(
  shopperEmail,
  authenticationState,
  profileData,
) {
  let shopperDetails = null;

  if (authenticationState === 'succeeded' && profileData) {
    const { shippingAddress } = profileData;
    const addressData = formatFastlaneAddress(shippingAddress);

    shopperDetails = {
      shopperEmail,
      telephoneNumber: formatFastlaneTelephoneNumber(profileData.phones),
      shopperName: {
        firstName: profileData.name?.firstName,
        lastName: profileData.name?.lastName,
      },
      shippingAddress: addressData,
      billingAddress: addressData,
    };
  }

  return shopperDetails;
}

function handleSubmitCustomer(response) {
  if (response.redirectUrl || response.fastlaneReturnUrl) {
    window.location.href = response.redirectUrl || response.fastlaneReturnUrl;
  } else {
    $('body').trigger('checkout:updateCheckoutView', {
      order: response.order,
      customer: response.customer,
      csrfToken: response.csrfToken,
    });
  }
}

async function fastlaneInit() {
  return window.AdyenWeb.initializeFastlane(store.checkoutConfiguration);
}

async function mountFastlaneWatermark(htmlEl) {
  const watermarkContainer = document.createElement('div');
  watermarkContainer.id = 'watermark-container';
  htmlEl.parentElement.appendChild(watermarkContainer);
  store.fastlane.component = await fastlaneInit();
  await store.fastlane.component.mountWatermark('#watermark-container');
}

async function fastlaneAuthenticate(url, shopperEmail, fastlaneAuthResult) {
  try {
    const { authenticationState, profileData } = fastlaneAuthResult;
    const shopperDetails = getFastlaneShopperDetails(
      shopperEmail,
      authenticationState,
      profileData,
    );

    const requestData = {
      dwfrm_coCustomer_email: shopperEmail,
      shopperDetails: JSON.stringify(shopperDetails),
    };

    const response = await httpClient({
      url,
      data: requestData,
      method: 'POST',
    });

    handleSubmitCustomer(response);
  } catch (err) {
    if (err.responseJSON?.redirectUrl) {
      window.location.href = err.responseJSON.redirectUrl;
    }
    document.querySelector('#guest-customer button').disabled = false;
  }
}

module.exports = {
  fastlaneAuthenticate,
  mountFastlaneWatermark,
};
