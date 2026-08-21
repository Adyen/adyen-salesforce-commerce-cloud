export const getTaxJurisdictionID = jest.fn();
export const getTaxRate = jest.fn();
export const TAX_POLICY_GROSS = 0;
export const TAX_POLICY_NET = 1;
export let taxationPolicy = TAX_POLICY_NET; // default to net; override per test
