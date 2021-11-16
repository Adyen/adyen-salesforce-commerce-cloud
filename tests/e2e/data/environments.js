import CheckoutPageSFRA from "../pages/CheckoutPageSFRA";
import AccountPage from "../pages/AccountPage";

const environments = [
  {
    name: 'SFRA',
    CheckoutPage: CheckoutPageSFRA,
    urlExtension: '/s/RefArch/home',
    AccountPage: AccountPage,
  }
]

module.exports = {
  environments,
}
