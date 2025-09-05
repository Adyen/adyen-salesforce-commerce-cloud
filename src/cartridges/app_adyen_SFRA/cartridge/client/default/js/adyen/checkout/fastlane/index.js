const store = require('../../../../../../config/store');
const constants = require('../../../../../../config/constants');

function formatFastlaneAddress(shippingAddress) {
  if (!shippingAddress) {
    return null;
  }
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

async function initFastlane() {
  store.fastlane.component = await window.AdyenWeb.initializeFastlane({
    ...store.checkoutConfiguration,
    forceConsentDetails:
      store.checkoutConfiguration.environment === constants.ENVIRONMENTS.TEST,
  });
}

async function mountFastlaneWatermark(htmlEl) {
  if (store.fastlane.component) {
    const watermarkContainer = document.createElement('div');
    watermarkContainer.id = 'watermark-container';
    htmlEl.parentElement.appendChild(watermarkContainer);
    await store.fastlane.component.mountWatermark('#watermark-container');
  }
}

async function fastlaneAuthenticate(shopperEmail) {
  store.fastlane.authResult =
    await store.fastlane.component.authenticate(shopperEmail);
  const { configuration } =
    await store.fastlane.component.getComponentConfiguration(
      store.fastlane.authResult,
    );
  store.fastlane.configuration = configuration;
}

module.exports = {
  initFastlane,
  fastlaneAuthenticate,
  mountFastlaneWatermark,
  getFastlaneShopperDetails,
};
