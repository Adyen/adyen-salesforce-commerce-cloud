# Salesforce Commerce Cloud Adyen Cartridge

Adyen provides a LINK cartridge to integrate with [Salesforce Commerce Cloud (SFCC)](https://docs.adyen.com/plugins/salesforce-commerce-cloud). This cartridge enables an SFCC storefront to use the Adyen payment service.  

## Compatibility with SFCC architectures
- SFRA version 5.x.x & 6.x.x.: [Supported in all cartridge versions, see the latest](https://github.com/Adyen/adyen-salesforce-commerce-cloud/releases)    
- SiteGenesis JS-Controllers version 103.1.11 and higher: Hosted in a separate repo - see cartridge [v22.2.3](https://github.com/Adyen/adyen-salesforce-commerce-cloud-site-genesis/releases/tag/22.2.3)

## Integration
This cartridge allows you to integrate with Adyen without the need for any development work from your end. Online payments are processed on the back-end using the [Checkout API](https://docs.adyen.com/api-explorer/Checkout/latest/overview), and on the client side, Adyen’s [Web Components](https://docs.adyen.com/online-payments/components-web) are used to render payment methods. 
Point of Sale (POS) payments are processed using a cloud-based [Terminal API](https://docs.adyen.com/point-of-sale/terminal-api-fundamentals).

This cartridge contains 2 folders, /src and /cartridges. The /src folder is the origin, while the /cartridges folder contains the transpiled code.

### Transpilation 
Some files in the /src directory contain modern JavaScript (ES6, MobX) that Salesforce Commerce Cloud does not natively support. 

To make the code compatible, we downgrade the ES6 to ES5 by transpiling, compiling, and uploading the auto-generated code to the /cartridges directory, see [more in our Docs](https://docs.adyen.com/plugins/salesforce-commerce-cloud/install-the-cartridge-and-import-the-metadata/#step-3-build-the-code).

### How to customize the cartridge
* (Before v 23.2.1) (**Recommended**) If you want to modify the cartridge code and you write in JavaScript ES6, you may need to use the /src folder. Performing a transpilation on the /src folder ensures that you can later move your customizations to a new cartridge version during an upgrade. This is achieved by comparing the code in the /src folders between different releases, see [GitHub instructions](https://docs.github.com/en/repositories/releasing-projects-on-github/comparing-releases).
* (Before v 23.2.1) You can add changes directly to /cartridges without transpiling if you use JavaScript ES5. These customizations will not be transpiled. This may result in a more complex upgrading process.
* (After v [23.2.1](https://github.com/Adyen/adyen-salesforce-commerce-cloud/releases/tag/23.2.1)) (**Recommended**) If you are able to modularize your customizations, create a new cartridge in your /cartridges directory and name it, for example, `int_custom_cartridge`, see [more in our Docs](https://docs.adyen.com/plugins/salesforce-commerce-cloud/customization-guide/#add-custom-code). These customizations will not be transpiled and will be preserved when you [upgrade to a new cartridge version](https://docs.adyen.com/plugins/salesforce-commerce-cloud/upgrade/#customized-integration).

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

We provide specialized cartridge support for major versions of the plugin following the [SFCC B2C Support policy](https://docs.adyen.com/plugins/salesforce-commerce-cloud#support-levels), along with permanent Adyen support. 

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
