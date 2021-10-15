import checkout from "../pages/CheckoutPage";
import NL from "./countriesEUR/NL";
import { regionsEnum } from "../data/enums"
//TODO check if we want to move URL
fixture`EUR`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home?lang=${regionsEnum.EU}`)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    });

// Do NL tests
NL();

//Do FR tests

//Do PT tests
