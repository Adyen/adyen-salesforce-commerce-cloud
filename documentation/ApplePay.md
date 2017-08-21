# ApplePay configuration

Salesforce Commerce Cloud provides integration with Apple Pay on the Web, where Adyen is used as one of the payment facilitators to accept Apple Pay tokens and process them.

## Prerequisites

Prerequisite to use ApplePay via Adyen is to enable Apple Pay on your Adyen merchant account and Web Service User.

To do this you need to register an Apple Merchant ID on https://developer.apple.com/.
Afterwards send the Apple Merchant ID and the selected Adyen Web Service User username to support@adyen.com

## Salesforce Commerce Cloud settings

1. Go to Merchant Tools → Site Preference → Apple Pay.
2. In the Payment integration section, fill in the following items:

Parameter Name            | Description
------------------------- | -------------
Apple Pay Enabled?        | Select the check box
Apple Merchant ID         | Enter your Apple Merchant ID (configurable in https://developer.apple.com/)
Apple Merchant Name       | Enter your Apple Merchant Name (configurable in https://developer.apple.com/)
Country Code              | Enter your Country Code
Merchant Capabilities     | Select 3DS
Supported Networks        | Select the supported networks
Redirect Pages to HTTPS?  | Select the check box
Use Commerce Cloud Apple Pay Payment API? | Select the check box
Payment Provider URL      | Use https://pal-test.adyen.com/pal/adapter/Demandware/authorise for Test or https://pal-live.adyen.com/pal/adapter/Demandware/authorise for Live
Payment Provider Merchant ID | Enter your Adyen Merchant Account name
API Version               | Select the latest
Use Basic Authentication? | Select the check box
Payment Provider User     | Your Adyen web service (WS) user name
Payment Provider Password | Your Adyen web service (WS) user password
Use JWS?                  | Leave it un-selected
JWS Private Key Alias     | Leave it empty

3. Register Apple Sandbox/Production domain on the Domain Registration section of Salesforce Commerce Cloud

4. Go to Merchant Tools → Ordering → Payment Methods → DW_APPLE_PAY and set the Payment Processor to ADYEN_CREDIT


--

For any questions regarding this integration, contact Salesforce Commerce Cloud directly.
