# Payment Methods Configuration

### Summary of Adyen Salesforce Commerce Cloud Checkout Configuration
The Adyen Salesforce Commerce Cloud checkout configuration is designed to integrate Adyen's payment methods seamlessly into Salesforce Commerce Cloud using the Storefront Reference Architecture (SFRA). This integration utilizes Adyen's Checkout Components to provide a customizable checkout experience.

### Key Configuration Options
The configuration allows for various settings to be customized, and it differs between payment methods.

- showPayButton: whether to display payment method button
- environment: defining the frontend environment
- Event Handlers: make sure to properly use event handlers such as `onSubmit`, `onError`, `onAuthorised`. 

## Example Configuration
Here's an example of the card configuration and how it can be defined:

```javascript
const defaultConfig = {
// Whether to display the cardholder name field
hasHolderName: this.hasHolderName,

// Whether the cardholder name is required
holderNameRequired: this.holderNameRequired,

// Enable storing card details for future transactions
enableStoreDetails: this.enableStoreDetails,

// Configuration for click-to-pay functionality
clickToPayConfiguration: this.clickToPayConfiguration,

// Whether to expose the expiry date field
exposeExpiryDate: this.exposeExpiryDate,

// Event handler for form changes
onChange: this.onChange,

// Event handler for form submission
onSubmit: this.onSubmit,

// Event handler for field validation
onFieldValid,

// Event handler for brand detection
onBrand,
};
```

This configuration object (defaultConfig) demonstrates how various settings can be customized to fit specific checkout requirements. By adjusting these properties, you can tailor the checkout experience to your needs.
In order to customize payment methods, modify the configuration files to adjust settings like those shown in the example code.


### Troubleshooting and Resources
- Payment Method Display Issues: Check configuration settings for any incorrect values.
- API Errors: Verify that your Adyen API credentials are correctly configured in SFCC.
- For more detailed information, refer to the [Adyen Checkout Components Documentation](https://docs.adyen.com/platforms/online-payments/checkout-components/).