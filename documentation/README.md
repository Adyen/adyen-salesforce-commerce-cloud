# Adyen Salesforce Commerce Cloud Integration

Integrate Adyen with Salesforce Commerce Cloud using the Storefront Reference Architecture (SFRA). This method provides seamless access to Adyen's extensive payment features through the Adyen payments cartridge.
&nbsp; 

The documentation includes detailed diagrams to help you understand the integration process and enhance your e-commerce capabilities using Adyen's robust payment solutions.
&nbsp;

For more details, visit the [Adyen Salesforce Commerce Cloud documentation](https://docs.adyen.com/plugins/salesforce-commerce-cloud/).

The below flow diagrams are applicable to this release.

## Get Payment Methods
![get-payment-methods.png](diagrams/get-payment-methods.png)
## Payment Without Action
Example payment methods, that are covered by this flow: Cards without 3DS, SepaDirectDebit 
![payment-without-action.png](diagrams/payment-without-action.png)
## Payment With Action
Example payment methods, that are covered by this flow: 3DS2 Cards, Bancontact, Amazon Pay
![payment-with-action.png](diagrams/payment-with-action.png)
## Payment From Component
Example payment methods, that are covered by this flow: PayPal, MBWay, Apple Pay
![payment-from-component.png](diagrams/payment-from-component.png)
## Single Giftcard Flow
![single-giftcard-flow.png](diagrams/single-giftcard-flow.png)
## Multiple Giftcards Flow
![multiple-giftcards-flow.png](diagrams/multiple-giftcards-flow.png)
## Apple Pay Express
Example payment methods, that are covered by this flow: Apple Pay Express from Cart/mini-cart
```mermaid
sequenceDiagram
    participant Customer
    participant Client as /client
    participant Controllers as /controllers
    participant Middlewares as /controllers/middlewares
    participant Payments as /adyen/scripts/payments
    participant ExpressPayments as /adyen/scripts/expressPayments
    participant ShippingMethodsModel
    participant CartModel
    participant CheckoutHelper
    participant AdyenCheckoutAPI as Adyen Checkout API

    Customer->>Client: GetPaymentMethods
    Client->>Controllers: getPaymentMethod()
    Controllers->>Middlewares: getPaymentMethod()
    Middlewares->>Payments: /paymentMethods
    Payments->>ExpressPayments: /paymentMethods
    ExpressPayments->>AdyenCheckoutAPI: /paymentMethods endpoint
    AdyenCheckoutAPI->>ExpressPayments: jsonResponse
    ExpressPayments->>Payments: jsonResponse
    Payments->>Middlewares: jsonResponse
    Middlewares->>Controllers: jsonResponse
    Controllers->>Client: jsonResponse

    Client->>Client: Adyen-ShippingMethods
    Client->>Controllers: callGetShippingMethods(shipment, address)
    Controllers->>Middlewares: callGetShippingMethods(shipment, address)
    Middlewares->>ExpressPayments: callGetShippingMethods(shipment, address)
    ExpressPayments->>ShippingMethodsModel: new ShippingMethodModel(shippingMethod, address)
    ShippingMethodsModel->>ExpressPayments: shippingMethodsData
    ExpressPayments->>Middlewares: shippingMethodsData
    Middlewares->>Controllers: jsonResponse
    Controllers->>Client: jsonResponse

    Client->>Client: Adyen-SelectShippingMethod
    Client->>Controllers: callSelectShippingMethod()
    Controllers->>Middlewares: callSelectShippingMethod()
    Middlewares->>ExpressPayments: callSelectShippingMethod()
    ExpressPayments->>CartModel: new CartModel(currentBasket)
    CartModel->>ExpressPayments: cartModelData
    ExpressPayments->>Middlewares: cartModelData
    Middlewares->>Controllers: jsonResponse
    Controllers->>Client: jsonResponse

    Client->>Client: initializeCheckout()
    Client->>Controllers: createOrder()
    Controllers->>Middlewares: createOrder()
    Middlewares->>Payments: calculatePaymentTransaction()
    Payments->>ExpressPayments: calculatePaymentTransactionTotal
    ExpressPayments->>CartModel: createOrder()
    CartModel->>CheckoutHelper: order
    CheckoutHelper->>CartModel: createPaymentRequest()
    CartModel->>AdyenCheckoutAPI: /payments request
    AdyenCheckoutAPI->>CartModel: /payments response
    CartModel->>CheckoutHelper: /payments response
    CheckoutHelper->>Middlewares: placeOrder()
    Middlewares->>Controllers: response
    Controllers->>Client: response

    Client->>Customer: Order-Confirm

    note right of Customer: Steps
    note right of Customer: 1. A call goes out from the front-end (client) to Adyen router (controller) to fetch the available payment methods and get apple pay configuration.
    note right of Customer: 2. Two extra calls are initiated from front-end and are handled in the back-end for fetching the available shipping methods based on address, and for selecting the shipping method. Both of them use helper functions coming from the SFRA architecture.
    note right of Customer: 3. The paymentFromComponent call is initiated from front-end when shopper authorizes a payment on the apple pay modale, which will hit the controller, populate the shipping/billing data coming from Apple Pay, use SFRA helpers to calculatePaymentTransaction and createOrder.
    note right of Customer: 4. Once order is created the payments endpoint on the checkout API will be called.
    note right of Customer: 5. The payments response is returned to the controllers/middleware. The middleware places the Order using the CheckoutHelper and creates a response object.
    note right of Customer: 6. The response is returned back to the client, which recognizes the payment succeeds and uses the response to navigate to the Order-Confirm page.
```
## PayPal Express
Example payment methods, that are covered by this flow: PayPal Express from Cart/mini-cart
xxxxx
