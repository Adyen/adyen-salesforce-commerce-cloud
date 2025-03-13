# Salesforce Commerce Cloud Adyen Cartridge

Adyen provides a LINK cartridge to integrate with [Salesforce Commerce Cloud (SFCC)](https://docs.adyen.com/plugins/salesforce-commerce-cloud). This cartridge enables an SFCC storefront to use the Adyen payment service.  

## Compatibility with SFCC architectures
- SFRA version 5.x.x, 6.x.x. & 7.x.x.: [Supported in all cartridge versions, see the latest](https://github.com/Adyen/adyen-salesforce-commerce-cloud/releases)    
- SiteGenesis JS-Controllers version 103.1.11 and higher: Hosted in a separate repo - see cartridge [v22.2.3](https://github.com/Adyen/adyen-salesforce-commerce-cloud-site-genesis/releases/tag/22.2.3)

## Integration
This cartridge allows you to integrate with Adyen without the need for any development work from your end. 
- Online payments are processed on the back-end using the [Checkout API](https://docs.adyen.com/api-explorer/Checkout/latest/overview), and on the client side, Adyen’s [Web Components](https://docs.adyen.com/online-payments/components-web) are used to render payment methods. 
- Point of Sale (POS) payments are processed using a cloud-based [Terminal API](https://docs.adyen.com/point-of-sale/terminal-api-fundamentals).

This cartridge contains 2 folders, /src and /cartridges. The /src folder is the origin, while the /cartridges folder contains the transpiled code.

### Transpilation 
Some files in the /src directory contain modern JavaScript (ES6, MobX) that Salesforce Commerce Cloud does not natively support. 
To make the code compatible, we downgrade the ES6 to ES5 by transpiling, compiling, and uploading the auto-generated code to the /cartridges directory, see [more in our Docs](https://docs.adyen.com/plugins/salesforce-commerce-cloud/install-the-cartridge-and-import-the-metadata/#step-3-build-the-code).

### Customization Best Practices
After [v 23.2.1]((https://github.com/Adyen/adyen-salesforce-commerce-cloud/releases/tag/23.2.1))
- **Best practice!** Modularizing customizations is the recommended approach, as [outlined by Salesforce](https://developer.salesforce.com/docs/commerce/sfra/guide/b2c-customizing-sfra.html).
- To customize Adyen payments, create a new cartridge in your /cartridges directory or leverage `int_custom_cartridge`, which is already set up in this repository.
- Customizations added to a separate cartridge will not be transpiled and will be preserved when you [upgrade to a new cartridge version](https://docs.adyen.com/plugins/salesforce-commerce-cloud/upgrade/#customized-integration).
- For more guidance on customization, refer to [Adyen Customization Guide](https://docs.adyen.com/plugins/salesforce-commerce-cloud/customization-guide/#add-custom-code).

Before v 23.2.1
- **Best practice!** Modularizing customizations is also the recommended approach for older versions, as [noted by Salesforce](https://developer.salesforce.com/docs/commerce/sfra/guide/b2c-customizing-sfra.html).
- Customizations added to a separate cartridge will not be transpiled and will be preserved when you [upgrade to a new cartridge version](https://docs.adyen.com/plugins/salesforce-commerce-cloud/upgrade/#customized-integration).
- For more guidance on customization, refer to [Adyen Customization Guide](https://docs.adyen.com/plugins/salesforce-commerce-cloud/customization-guide/#add-custom-code).

**Not Recommended**
- We strongly discourage adding changes directly to /cartridges or /src/cartridges.
- Customizations made in these directories cannot be easily separated from your codebase once deployed to production, leading to a more complex and costly upgrade process.

## Requirements

It is required to have an Adyen TEST and, later, LIVE account to use the cartridge. You can set it up [here](https://www.adyen.com/signup) or [contact Adyen](https://www.adyen.com/contact/sales).

## Installation, Usage and Configuration

Installation, Usage and Configuration is explained in Adyen's [online documentation](https://docs.adyen.com/plugins/salesforce-commerce-cloud/).

Apple Pay configuration for both Adyen certificate and Apple certificate using Salesforce cartridge can be found [here](https://docs.adyen.com/plugins/salesforce-commerce-cloud/set-up-payment-methods/#set-up-apple-pay-on-the-web). 
We recommend using Apple pay with Adyen certificate.

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

We provide specialized cartridge support for 2 years for major versions, following the [SFCC B2C Support policy](https://docs.adyen.com/plugins/salesforce-commerce-cloud#support-levels), along with permanent Adyen support. 

When a major cartridge version is no longer under cartridge support, it will be treated as a custom merchant integration. From version 23 onward, we do not provide any level of support for SiteGenesis integrations.

[Migration and Upgrade Guide](https://docs.adyen.com/plugins/salesforce-commerce-cloud/upgrade)

[SFCC Cartridge Support Schedule for SFRA and SiteGenesis](https://docs.adyen.com/plugins/salesforce-commerce-cloud/#support-levels)

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
