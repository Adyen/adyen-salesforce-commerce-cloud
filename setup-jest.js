import $ from 'jquery';
global.$ = global.jQuery = $;

const mount = jest.fn();
const create = jest.fn(() => ({ mount }));

global.AdyenCheckout = jest.fn(() => ({create}));

global.showStoreDetails = false;

