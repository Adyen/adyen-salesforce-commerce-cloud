/**
 * @jest-environment jsdom
 */
/* eslint-disable global-require */
let saveExpressShopperDetails;
let callGetShippingMethods;
let res;
let req;
let shipment;

beforeEach(() => {
  const { adyen } = require('../../index');
  saveExpressShopperDetails = adyen.saveExpressShopperDetails;
  callGetShippingMethods = adyen.callGetShippingMethods;
  shipment = 'mocked_shipment'
  jest.clearAllMocks();
  req = {
    querystring : {
      shipmentUUID : 'mocked_uuid',
    },
    form: {
      paymentMethod: 'method',
      shipmentUUID : 'mocked_uuid',
      data: {
        paymentMethod: {
          type: 'mocked_type'
        }
      },
      shopperDetails : {
        billingAddress : {
        name : "Amber Kelly",
        addressLine1: "Simon Carmiggeltstraat",
        city : "Amsterdam",
        postalCode: "1011 DJ",
        countryCode : "NL",
        phoneNumber : "418351367"
        },
        shippingAddress : {
          name : "Maria Garcia",
          addressLine1 : "Carrer del Torrent Vallmajor; 100 Badalona",
          city : "Barcelona",
          stateOrRegion : "Catalonia",
          postalCode : "08915",
          countryCode : "ES",
          phoneNumber : "+880 9900-111111"
      },
      },
    }
  };
  res = { redirect: jest.fn(), json: jest.fn() };
});

afterEach(() => {
  jest.resetModules();
});


describe('Save express shopper details and retrieve shipping methods', () => {
    it('Should save shopper details', () => {
      const {
        getShipmentByUUID,
      } = require('*/cartridge/scripts/checkout/shippingHelpers')
      req.form.shopperDetails = JSON.stringify(req.form.shopperDetails);
      req.querystring = JSON.stringify(req.querystring);
      console.log(req);
      saveExpressShopperDetails(req, res, jest.fn());
      //expect(callGetShippingMethods).toBeCalledTimes(1);
    });
  });