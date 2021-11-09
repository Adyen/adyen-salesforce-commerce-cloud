import CheckoutPageSFRA from "../pages/CheckoutPageSFRA";

const environments = [
  {
    name: 'SFRA',
    CheckoutPage: CheckoutPageSFRA,
    urlExtension: '/s/RefArch/home',
  }
]

module.exports = {
  environments,
}
