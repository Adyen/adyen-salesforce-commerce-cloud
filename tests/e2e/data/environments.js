import CheckoutPageSFRA from "../pages/CheckoutPageSFRA";
import CheckoutPageSG from "../pages/CheckoutPageSG";

const environments = [
  {
    name: 'SFRA',
    CheckoutPage: CheckoutPageSFRA,
    urlExtension: '/s/RefArch/home',
  },
  {
    name: 'SG',
    CheckoutPage: CheckoutPageSG,
    urlExtension: '/on/demandware.store/Sites-SiteGenesis-Site',
  }
]

module.exports = {
  environments,
}
