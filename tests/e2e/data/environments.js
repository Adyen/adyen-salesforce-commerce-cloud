import CheckoutPageSFRA from "../pages/CheckoutPageSFRA";
import CheckoutPageSFRA6 from "../pages/CheckoutPageSFRA6";
import CheckoutPageSG from "../pages/CheckoutPageSG";
import AccountPageSFRA from "../pages/AccountPageSFRA";
import AccountPageSG from "../pages/AccountPageSG";

const environments = [];
if(process.env.SFRA_VERSION === 'v5.3.0') {
  environments.push(
    {
      name: 'SFRA v5.3.0',
      CheckoutPage: CheckoutPageSFRA,
      urlExtension: '/s/RefArch/home',
      AccountPage: AccountPageSFRA,
    },
    {
      name: 'SG',
      CheckoutPage: CheckoutPageSG,
      urlExtension: '/on/demandware.store/Sites-SiteGenesis-Site',
      AccountPage: AccountPageSG,
    }
  );
}

if(process.env.SFRA_VERSION === 'v6.0.0') {
  environments.push(
      {
        name: 'SFRA v6.0.0',
        CheckoutPage: CheckoutPageSFRA6,
        urlExtension: '/s/RefArch/home',
        AccountPage: AccountPageSFRA,
      }
  );
}

module.exports = {
  environments,
}
