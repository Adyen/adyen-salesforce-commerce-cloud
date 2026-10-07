/* The SFRA jobs run in parallel against one shared Adyen test account and submit
otherwise identical guest payments. A risk rule scores those as duplicates and
refuses them when they land within seconds of each other, which is what made the
PayPal payment fail with refusalReason FRAUD while the same payment succeeded
whenever a job ran on its own. Keeping the shopper distinct per SFRA version, CI
run and worker keeps the transactions from looking like retries of one another.

Only alphanumerics survive from each part, so the address stays valid wherever
the storefront validates it. */
export const guestCheckoutEmail = () => {
  const scope = [
    process.env.SFRA_VERSION,
    process.env.GITHUB_RUN_ID,
    process.env.TEST_WORKER_INDEX,
  ]
    .filter((part) => part !== undefined && part !== '')
    .map((part) => String(part).replace(/[^a-zA-Z0-9]+/g, ''))
    .filter(Boolean)
    .join('.');

  return scope ? `test.${scope}@adyenTest.com` : 'test@adyenTest.com';
};
