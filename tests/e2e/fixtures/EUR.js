import checkout from "../pages/CheckoutPage";
import NL from "./countriesEUR/NL";
//TODO check if we want to move URL
fixture`EUR`
    .page(process.env.STOREFRONT_EUR)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    });

// Do NL tests
NL();

//Do FR tests

//Do PT tests