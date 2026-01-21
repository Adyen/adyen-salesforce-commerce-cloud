# Salesforce Commerce Cloud Adyen Cartridge

Adyen provides a LINK cartridge to integrate with [Salesforce Commerce Cloud (SFCC)](https://docs.adyen.com/plugins/salesforce-commerce-cloud). This cartridge enables an SFCC storefront to use the Adyen payment service. 

## Documentation and Support

For general inquiries related to this repository, developers are welcome to leverage [![AskDeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Adyen/adyen-salesforce-commerce-cloud) AI knowledge base. Please note that while the DeepWiki can be a helpful resource, the **official [Adyen documentation](https://docs.adyen.com/plugins/salesforce-commerce-cloud/) remains the source of truth** for the cartridge. Information found in the DeepWiki should be used at your own discretion.

Navigate to [Adyen Docs](https://docs.adyen.com/plugins/salesforce-commerce-cloud/) to read about how to:
- [1. Install the cartridge and import the metadata](https://docs.adyen.com/plugins/salesforce-commerce-cloud/sfra/install-the-cartridge-and-import-the-metadata),
- [2. Set up the cartridge](https://docs.adyen.com/plugins/salesforce-commerce-cloud/sfra/set-up-the-cartridge?plugin=Salesforce+SFRA&integration=cartridge),
- [3. Set up payment methods](https://docs.adyen.com/plugins/salesforce-commerce-cloud/sfra/set-up-payment-methods?plugin=Salesforce+SFRA&integration=cartridge) (We recommend using Apple pay with Adyen certificate as Adyen has no insight into Salesforce Apple Pay cartridge),
- [4. Go-live checklist](https://docs.adyen.com/plugins/salesforce-commerce-cloud/sfra/go-live-checklist),
- [5. Customization guide](https://docs.adyen.com/plugins/salesforce-commerce-cloud/sfra/customization-guide),
- [6. Salesforce Commerce Cloud troubleshooting](https://docs.adyen.com/plugins/salesforce-commerce-cloud/sfra/troubleshooting),
- [7. Upgrade the cartridge](https://docs.adyen.com/plugins/salesforce-commerce-cloud/sfra/upgrade),
- [8. Supported payment methods](https://docs.adyen.com/plugins/salesforce-commerce-cloud/supported-payment-methods)

Adyen provides specialized cartridge support for 2 years for major versions, following the [SFCC B2C Support policy](https://docs.adyen.com/plugins/salesforce-commerce-cloud#support-levels), along with permanent Adyen support. Navigate to your Adyen Customer Area Merchant Account to raise a support case.
When a major cartridge version is no longer under cartridge support, it will be treated as a custom merchant integration. 

### Customization Best Practices
**Best practice!** 
- Modularizing customizations is the recommended approach, as [outlined by Salesforce](https://developer.salesforce.com/docs/commerce/sfra/guide/b2c-customizing-sfra.html).
- To customize Adyen payments, create a custom cartridge in your project directory or leverage `int_custom_cartridge`, which is already set up in our repository.
- For more guidance on customization, refer to [Adyen Customization Guide](https://docs.adyen.com/plugins/salesforce-commerce-cloud/customization-guide/#add-custom-code).

**Not Recommended**
- We strongly discourage adding changes directly to Adyen code in /src/cartridges.
- Customizations made in Adyen default code cannot be easily separated from your codebase once deployed to production, leading to a more complex and costly upgrade process and reduced Support.

## Compatibility with SFCC architectures
- SFRA version 5.x.x, 6.x.x. & 7.x.x.: [Supported in all cartridge versions, see the latest](https://github.com/Adyen/adyen-salesforce-commerce-cloud/releases)
- We have a [separate repository for Adyen SFCC PWA (Composable Storefront)](https://github.com/Adyen/adyen-salesforce-headless-commerce-pwa) payment integration.   

## Integration
This cartridge allows you to integrate with Adyen without the need for any development work from your end. 
- Online payments are processed on the back-end using the [Checkout API](https://docs.adyen.com/api-explorer/Checkout/latest/overview), and on the client side, Adyen’s [Web Components](https://docs.adyen.com/online-payments/components-web) are used to render payment methods. 
- Point of Sale (POS) payments are processed using a cloud-based [Terminal API](https://docs.adyen.com/point-of-sale/terminal-api-fundamentals).

### Transpilation 
Some files in the /src directory contain modern JavaScript (ES6) that Salesforce Commerce Cloud does not natively support. 
If you want to make ES6 code compatible with ES5 by transpiling, compiling, and uploading the auto-generated code to the /cartridges directory, see [more in our Docs](https://docs.adyen.com/plugins/salesforce-commerce-cloud/install-the-cartridge-and-import-the-metadata/#step-3-build-the-code).


## Requirements

It is required to have an Adyen TEST and, later, LIVE account to use the cartridge. You can set it up [here](https://www.adyen.com/signup) or [contact Adyen](https://www.adyen.com/contact/sales).

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
