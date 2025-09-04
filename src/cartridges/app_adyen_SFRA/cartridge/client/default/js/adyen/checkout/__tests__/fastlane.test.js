/**
 * @jest-environment jsdom
 */
/* eslint-disable global-require */
const store = require('../../../../../../config/store');
const constants = require('../../../../../../config/constants');
const {
  initFastlane,
  mountFastlaneWatermark,
  fastlaneAuthenticate,
  getFastlaneShopperDetails,
} = require('../fastlane');

jest.mock('../../../../../../config/store', () => ({
  checkoutConfiguration: {
    environment: 'TEST',
  },
  fastlane: {},
}));

jest.mock('../../../../../../config/constants', () => ({
  ENVIRONMENTS: {
    TEST: 'TEST',
  },
}));

window.AdyenWeb = { initializeFastlane: jest.fn() };

describe('Fastlane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.fastlane = {};
    store.checkoutConfiguration.environment = constants.ENVIRONMENTS.TEST;
  });

  describe('initFastlane', () => {
    it('should initialize Fastlane with forceConsentDetails for TEST environment', async () => {
      const mockComponent = { id: 'fastlane-component' };
      window.AdyenWeb.initializeFastlane.mockResolvedValue(mockComponent);

      await initFastlane();

      expect(window.AdyenWeb.initializeFastlane).toHaveBeenCalledWith({
        ...store.checkoutConfiguration,
        forceConsentDetails: true,
      });
      expect(store.fastlane.component).toEqual(mockComponent);
    });

    it('should initialize Fastlane without forceConsentDetails for non-TEST environment', async () => {
      store.checkoutConfiguration.environment = 'LIVE';
      const mockComponent = { id: 'fastlane-component' };
      window.AdyenWeb.initializeFastlane.mockResolvedValue(mockComponent);

      await initFastlane();

      expect(window.AdyenWeb.initializeFastlane).toHaveBeenCalledWith({
        ...store.checkoutConfiguration,
        forceConsentDetails: false,
      });
      expect(store.fastlane.component).toEqual(mockComponent);
    });
  });

  describe('mountFastlaneWatermark', () => {
    it('should mount watermark if component exists', async () => {
      const mockMountWatermark = jest.fn().mockResolvedValue(true);
      store.fastlane.component = {
        mountWatermark: mockMountWatermark,
      };

      document.body.innerHTML = `
        <div>
          <div id="html-el-for-test"></div>
        </div>
      `;
      const htmlEl = document.getElementById('html-el-for-test');
      const parentEl = htmlEl.parentElement;
      jest.spyOn(parentEl, 'appendChild');

      await mountFastlaneWatermark(htmlEl);

      expect(parentEl.appendChild).toHaveBeenCalledTimes(1);
      const appendedElement = parentEl.appendChild.mock.calls[0][0];
      expect(appendedElement.id).toBe('watermark-container');
      expect(mockMountWatermark).toHaveBeenCalledWith('#watermark-container');
    });

    it('should not mount watermark if component does not exist', async () => {
      store.fastlane.component = null;
      const mockAppendChild = jest.fn();
      const mockHtmlEl = { parentElement: { appendChild: mockAppendChild } };
      await mountFastlaneWatermark(mockHtmlEl);
      expect(mockAppendChild).not.toHaveBeenCalled();
    });
  });

  describe('fastlaneAuthenticate', () => {
    it('should authenticate and update store with configuration', async () => {
      const shopperEmail = 'test@adyen.com';
      const mockAuthResult = { authenticationState: 'succeeded' };
      const mockConfiguration = { some: 'config' };
      const mockAuthenticate = jest.fn().mockResolvedValue(mockAuthResult);
      const mockGetComponentConfiguration = jest
        .fn()
        .mockResolvedValue({ configuration: mockConfiguration });

      store.fastlane.component = {
        authenticate: mockAuthenticate,
        getComponentConfiguration: mockGetComponentConfiguration,
      };

      await fastlaneAuthenticate(shopperEmail);

      expect(mockAuthenticate).toHaveBeenCalledWith(shopperEmail);
      expect(store.fastlane.authResult).toEqual(mockAuthResult);
      expect(
        mockGetComponentConfiguration,
      ).toHaveBeenCalledWith(mockAuthResult);
      expect(store.fastlane.configuration).toEqual(mockConfiguration);
    });
  });

  describe('getFastlaneShopperDetails', () => {
    const shopperEmail = 'test@adyen.com';

    it('should return null if authenticationState is not "succeeded"', () => {
      const details = getFastlaneShopperDetails(shopperEmail, 'failed', {});
      expect(details).toBeNull();
    });

    it('should return null if profileData is not provided', () => {
      const details = getFastlaneShopperDetails(shopperEmail, 'succeeded', null);
      expect(details).toBeNull();
    });

    it('should format and return shopper details on successful authentication', () => {
      const profileData = {
        name: { firstName: 'John', lastName: 'Doe' },
        phones: [{ countryCode: '+1', nationalNumber: '1234567890' }],
        shippingAddress: {
          name: { firstName: 'John', lastName: 'Doe' },
          address: {
            addressLine1: '123 Main St',
            adminArea2: 'San Francisco',
            adminArea1: 'CA',
            postalCode: '94105',
            countryCode: 'US',
          },
          phoneNumber: { countryCode: '+1', nationalNumber: '0987654321' },
        },
      };

      const expectedDetails = {
        shopperEmail,
        telephoneNumber: '+11234567890',
        shopperName: { firstName: 'John', lastName: 'Doe' },
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main St',
          city: 'San Francisco',
          telephoneNumber: '+10987654321',
          postalCode: '94105',
          stateOrProvince: 'CA',
          country: 'US',
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          street: '123 Main St',
          city: 'San Francisco',
          telephoneNumber: '+10987654321',
          postalCode: '94105',
          stateOrProvince: 'CA',
          country: 'US',
        },
      };

      const details = getFastlaneShopperDetails(
        shopperEmail,
        'succeeded',
        profileData,
      );
      expect(details).toEqual(expectedDetails);
    });

    it('should handle missing optional fields in profileData', () => {
      const profileData = {
        name: { firstName: 'Jane' },
        phones: [],
        shippingAddress: {
          name: { firstName: 'Jane' },
          address: {
            addressLine1: '456 Other St',
            countryCode: 'NL',
          },
        },
      };

      const details = getFastlaneShopperDetails(
        shopperEmail,
        'succeeded',
        profileData,
      );
      expect(details.shopperName.lastName).toBeUndefined();
      expect(details.telephoneNumber).toBeNull();
      expect(details.shippingAddress.telephoneNumber).toBe('');
    });
  });
});