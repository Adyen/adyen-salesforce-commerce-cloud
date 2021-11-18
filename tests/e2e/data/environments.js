import CheckoutPageSFRA from "../pages/CheckoutPageSFRA";
import CheckoutPageSG from "../pages/CheckoutPageSG";
import AccountPageSFRA from "../pages/AccountPageSFRA";
import AccountPageSG from "../pages/AccountPageSG";

const environments = [
  {
    name: 'SFRA',
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
]

module.exports = {
  environments,
}
