# Salesforce Commerce Cloud Adyen Cartridge

Adyen provides a LINK cartridge to integrate with [Salesforce Commerce Cloud (SFCC)](https://docs.adyen.com/plugins/salesforce-commerce-cloud). This cartridge enables a SFCC storefront to use the Adyen payment service.  
This cartridge [supports](https://docs.adyen.com/plugins/salesforce-commerce-cloud#supported-versions) SFRA version 5.x.x & 6.x.x.   
and SiteGenesis JS-Controllers version 103.1.11 and higher (no features in cartridges higher than [v22.2.2](https://github.com/Adyen/adyen-salesforce-commerce-cloud/releases/tag/22.2.2))

## Integration
This cartridge allows you to integrate with Adyen without the need for any development work from your end.  
Online payments are processed on the back-end using the [Checkout API](https://docs.adyen.com/api-explorer/Checkout/latest/overview), on the client side Adyen’s [Web Components](https://docs.adyen.com/online-payments/components-web) are used to render payment methods.  
Point of Sale (POS) payments are processed using a cloud-based [Terminal API](https://docs.adyen.com/point-of-sale/terminal-api-fundamentals). 

## Requirements

It is required to have an Adyen account to use the cartridge. You can do this [here](https://www.adyen.com/signup).

## Installation, Usage and Configuration

Installation, Usage and Configuration is explained in Adyen's [online documentation](https://docs.adyen.com/plugins/salesforce-commerce-cloud/).

Apple Pay configuration for both Adyen certificate and Apple certificate using Salesforce cartridge can be found [here](https://docs.adyen.com/plugins/salesforce-commerce-cloud/set-up-payment-methods/#set-up-apple-pay-on-the-web).

## Testing
End-to-End tests can be found in the `adyen-salesforce-commerce-cloud/tests/e2e` directory. 
They are run automatically via Github Actions using the `E2E.yml` workflow.
To run the tests locally use the following command:
```
`npm run test:e2e`
```
Note: Please make sure to fill in the environment variables in the `fixtures` directory before running the tests locally.

As for Unit tests, they are currently only available for SFRA. Test files can be found next to the files they are testing. Mocks are kept in the `jest` directory.
To run SFRA unit tests locally use the following command:
```
`npm run test`
```
## Support & Maintenance

We provide three levels of support for major versions of the plugin as per [SFCC B2C Support policy](https://docs.adyen.com/plugins/salesforce-commerce-cloud#support-levels):

- **Level 1**: Full support. Keep in mind that some new features are not possible on older versions, therefore this is not inclusive of ALL new features that are built.
- **Level 2**: High priority bug fixes and security updates.
- **Level 3**: Security updates only.

After Level 3 End-of-support date, there is no support or maintenance from Adyen on the cartridge, and it will be treated as a custom integration.

[Migration and Upgrade Guide](https://docs.adyen.com/plugins/salesforce-commerce-cloud/upgrade)

[SFCC Cartridge Support Schedule for SFRA and SiteGenesis](https://docs.adyen.com/plugins/salesforce-commerce-cloud/#support-levels)

From version 23 onward, we do not provide any level of support for SiteGenesis integrations.

## Contributing
We strongly encourage you to join us in contributing to this repository so everyone can benefit from:
* New features and functionality
* Resolved bug fixes and issues
* Any general improvements

Read our [**contribution guidelines**](CONTRIBUTING.md) to find out how.

## Platform

Read more information about the [Adyen platform](https://www.adyen.com/platform).

## Licence

MIT license see LICENSE.
