import { expect } from '@playwright/test';

/* Both SFRA checkout page objects expose the same checkoutPageUser* locators,
so `form` is the page object itself. The stages around the form differ per
version and stay with the callers. */
export const fillShippingForm = async (form, shopperDetails) => {
  /* The shipping form stays hidden until the customer stage has finished
  transitioning, and it can be visible before it is editable, so gate on both.
  fill() is used throughout rather than type(), because type() only focuses its
  target and would send the keystrokes nowhere while the form is still
  settling. */
  await expect(form.checkoutPageUserFirstNameInput).toBeVisible();
  await expect(form.checkoutPageUserFirstNameInput).toBeEditable();

  await form.checkoutPageUserFirstNameInput.fill(
    shopperDetails.shopperName.firstName,
  );
  await form.checkoutPageUserLastNameInput.fill(
    shopperDetails.shopperName.lastName,
  );
  await form.checkoutPageUserStreetInput.fill(shopperDetails.address.street);
  await form.checkoutPageUserHouseNumberInput.fill(
    shopperDetails.address.houseNumberOrName,
  );
  await form.checkoutPageUserCityInput.fill(shopperDetails.address.city);
  await form.checkoutPageUserPostCodeInput.fill(
    shopperDetails.address.postalCode,
  );

  await form.checkoutPageUserCountrySelect.selectOption(
    shopperDetails.address.country,
  );

  await form.checkoutPageUserTelephoneInput.fill(shopperDetails.telephone);

  if (await form.checkoutPageUserStateSelect.isVisible()) {
    await form.checkoutPageUserStateSelect.selectOption({ index: 1 });
    if (shopperDetails.address.stateOrProvince !== '') {
      await form.checkoutPageUserStateSelect.selectOption(
        shopperDetails.address.stateOrProvince,
      );
    }
  }
};
