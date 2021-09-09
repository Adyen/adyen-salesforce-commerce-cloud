# Salesforce Commerce Cloud Adyen Cartridge

Adyen provides a LINK cartridge to integrate with [Salesforce Commerce Cloud (SFCC)](https://www.adyen.com/partners/salesforce-commerce-cloud). This cartridge enables a SFCC storefront to use the Adyen payment service. This cartridge supports SFRA version 4.x.x, 5.x.x, 6.x.x and SiteGenesis JS-Controllers version 103.1.11 and higher.

Please note that the cartridge is not compatible with SFRA version 4.3.x and 4.4.x due to a [bug](https://github.com/SalesforceCommerceCloud/storefront-reference-architecture/pull/797) on Salesforce.

## Integration
This cartridge allows you to integrate with Adyen without the need for any development work from your end. It allows you to process payments using the [checkout API](https://docs.adyen.com/api-explorer/#/CheckoutService/v67/overview), and for Point of Sale (POS) payments, it uses a cloud-based [Terminal API](https://docs.adyen.com/point-of-sale/terminal-api-fundamentals). As for the client side, Adyen’s [web components](https://docs.adyen.com/online-payments/components-web) are used to render payment methods.

## Requirements

It is required to have an Adyen account to use the cartridge. You can do this [here](https://www.adyen.com/signup).

## Installation, Usage and Configuration

Installation, Usage and Configuration is explained in Adyen's [online documentation](https://docs.adyen.com/plugins/salesforce-commerce-cloud/).

Apple Pay configuration can be found [here](https://docs.adyen.com/plugins/salesforce-commerce-cloud/set-up-payment-methods/#set-up-apple-pay-on-the-web).

## Support
If you have a feature request, or spotted a bug or a technical problem, create a GitHub issue. For other questions, contact our [support team](https://support.adyen.com/hc/en-us/requests/new?ticket_form_id=360000705420).

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
