//importing jquery
import $ from 'jquery';
global.$ = global.jQuery = $;

//mocking "checkout" and its functions "mount" and "create"
const mount = jest.fn();
const create = jest.fn(() => ({ mount }));

//mocking "AdyenCheckout" and its function "create"
global.AdyenCheckout = jest.fn(() => ({create}));

//mocking "showStoreDetails"
global.showStoreDetails = false;

