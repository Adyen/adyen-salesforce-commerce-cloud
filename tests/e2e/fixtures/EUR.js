import checkout from "../pages/CheckoutPage";
import NL from "./countriesEUR/NL";
import PT from "./countriesEUR/PT";
import BE from "./countriesEUR/BE";

import { regionsEnum } from "../data/enums"
//TODO check if we want to move URL
fixture`EUR`
    .page(`https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=${regionsEnum.EU}`)
    .httpAuth({
        username: 'storefront',
        password: 'fGMxsfjLwb3XtZ2gqKyZ3m4h7J',
    });

// Do NL tests
// NL();

//Do FR tests

//Do PT tests
// PT();

// BE();