import CheckoutPageSFRA5 from '../pages/CheckoutPageSFRA5.mjs';
import CheckoutPageSFRA6 from '../pages/CheckoutPageSFRA6.mjs';
import AccountPageSFRA from '../pages/AccountPageSFRA.mjs';

export const environments = [];
if (process.env.SFRA_VERSION === 'v5.3.0') {
  environments.push(
    {
      name: 'SFRA v5.3.0',
      CheckoutPage: CheckoutPageSFRA5,
      urlExtension: '/s/RefArch/home',
      AccountPage: AccountPageSFRA,
    }
  );
}

if (process.env.SFRA_VERSION === 'v6.1.0') {
  environments.push({
    name: 'SFRA v6.1.0',
    CheckoutPage: CheckoutPageSFRA6,
    urlExtension: '/s/RefArch/home',
    AccountPage: AccountPageSFRA,
  });
}

if (process.env.SFRA_VERSION === 'v7.0.0') {
  environments.push({
    name: 'SFRA v7.0.0',
    CheckoutPage: CheckoutPageSFRA6,
    urlExtension: '/s/RefArch/home',
    AccountPage: AccountPageSFRA,
  });
}


