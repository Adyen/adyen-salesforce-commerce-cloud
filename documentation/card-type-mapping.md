# Card brand mapping

`src/cartridges/int_adyen_SFRA/cartridge/adyen/config/card-type-mapping.json` maps an Adyen card brand (also called payment method variant, for example `visa`, `maestro_usa`, `pulse`) to the SFCC card type name that merchants configure under **Merchant Tools > Ordering > Payment Methods > Credit/Debit Cards**.

The mapping is read by `AdyenHelper.getSfccCardType(brand)` and drives:

| Where | What it sets |
| --- | --- |
| `handle` payment hook (`convertToSfccCardType`) | `paymentInstrument.creditCardType`, `custom.adyenPaymentMethod`, `custom.adyen_payment__Adyen_Payment_Method` |
| `updateSavedCards` | `creditCardType` of the cards stored in the shopper's wallet |

`Adyen_Payment_Method_Variant` is not derived from this file: it always holds the payment method type from the component state data (`scheme` for cards).

## Brand resolution

For a card payment the brand is taken from the first of these that has a value:

1. the `cardType` form field, filled by the Card Component `onBrand` callback (`app_adyen_SFRA/.../paymentMethodsConfiguration/card/cardConfig.js`);
2. `stateData.paymentMethod.brand`, which is where a co-branded card carries the brand the shopper selected;
3. `stateData.paymentMethod.srcScheme`, used by Click to Pay.

Wallet transactions are reported with a suffixed brand (`visa_applepay`, `mc_googlepay`, `maestro_usa_samsungpay`). `getSfccCardType` strips the `_applepay`, `_googlepay` and `_samsungpay` suffixes before the lookup, so only the base brand needs an entry in the file.

## Unmapped brands

Adyen adds new brands and co-branded variants over time, so a brand can be absent from the mapping. In that case:

- `getSfccCardType` returns an empty string and writes an `Adyen_warning` log entry naming the brand;
- `creditCardType` is left untouched, because SFCC would reject a card type that the merchant has not configured;
- `adyenPaymentMethod` and `adyen_payment__Adyen_Payment_Method` fall back to the raw Adyen brand, so OMS reporting keeps a meaningful value instead of an empty one.

## Adding a brand

The recommended way is to override the file from your own cartridge, which does not require a plugin upgrade:

1. Create `cartridge/adyen/config/card-type-mapping.json` in your custom cartridge (or in `int_custom_cartridge`).
2. Copy the file from `int_adyen_SFRA` and add the missing brands, for example `"eftpos_australia": "Eftpos Australia"`.
3. Make sure your cartridge precedes `int_adyen_SFRA` in the cartridge path, since the mapping is required through the `*/cartridge/...` path.
4. Add the SFCC card type used as the value under **Payment Methods > Credit/Debit Cards** so that SFCC can render and validate it.

Check the `Adyen_warning` logs for `No SFCC card type mapping found for Adyen brand` to find the brands your shoppers actually use.
