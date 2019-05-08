# Salesforce Commerce Cloud Adyen Cartridge

Adyen provides a LINK cartridge to integrate with a Salesforce Commerce Cloud (SCC). This cartridge enables a SCC store to use the Adyen payment service. This cartridge supports SFRA up to v3.3.0 and JS-Controllers.

## Integration
The plugin integrates Classic integration for all card payments. Local/redirect payment methods are integrated with DirectoryLookup and HPP. For Point Of Sale (POS) payments we use Terminal API using Cloud-based communication. 

## Requirements
  
It is mandatory that the merchant has to open an account with Adyen and configure some items in Commerce Cloud Business Manager, as well as in the Adyen account to make the integration working properly.
The integration is based on the Site Genesis demo store provided by Commerce Cloud.
  
## Installation, Usage and Configuration

Installation, Usage and Configuration is explained in our [manual](https://docs.adyen.com/plugins/salesforce-commerce-cloud/).

ApplePay configuration can be found [here](https://docs.adyen.com/plugins/salesforce-commerce-cloud/set-up-payment-methods/#set-up-apple-pay-on-the-web)

## Support
  
In case of problems with the integration or connection to Adyen, contact the [Adyen Support Team](mailto:support@adyen.com) or your Adyen account manager.
Supply as much information as possible: your merchant account, skin code, time, order number, PSP reference, etc.

## Licence
  
MIT license see LICENSE.
