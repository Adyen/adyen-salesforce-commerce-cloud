/**
 * @jest-environment jsdom
 */
/* eslint-disable global-require */
let saveExpressShopperDetails;
let res;
let req;
let shipment;
let currentBasket;

const {
  setBillingAndShippingAddress,
} = require('../saveExpressShopperDetails');

beforeEach(() => {
  const { adyen } = require('../../index');
  saveExpressShopperDetails = adyen.saveExpressShopperDetails;
  shipment = 'mocked_shipment';
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  jest.clearAllMocks();
  req = {
    form: {
      shopperDetails: {
        billingAddress: {
          name: 'Amber Kelly',
          addressLine1: 'Simon Carmiggeltstraat',
          city: 'Amsterdam',
          postalCode: '1011 DJ',
          countryCode: 'NL',
          phoneNumber: '418351367',
        },
        shippingAddress: {
          name: 'Maria Garcia',
          addressLine1: 'Carrer del Torrent Vallmajor; 100 Badalona',
          city: 'Barcelona',
          stateOrRegion: 'Catalonia',
          postalCode: '08915',
          countryCode: 'ES',
          phoneNumber: '+880 9900-111111',
        },
      },
    },
  };

  res = { redirect: jest.fn(), json: jest.fn(
  ) };
});

afterEach(() => {
  jest.resetModules();
});

describe('Save express shopper details and retrieve shipping methods', () => {
  
  it('Should fail setting shopper details', () => {
    //const Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
    req = JSON.stringify(req);
    saveExpressShopperDetails(req, res, jest.fn());
  });

});
