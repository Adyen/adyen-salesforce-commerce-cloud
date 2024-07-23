const Money = require('../value/Money');

const shippingMethods = [
  {
    description: 'Order received within 7-10 business days',
    displayName: 'Ground',
    ID: '001',
    custom: {
      estimatedArrivalTime: '7-10 Business Days',
    },
    getTaxClassID: jest.fn(),
  },
  {
    description: 'Order received in 2 business days',
    displayName: '2-Day Express',
    ID: '002',
    shippingCost: '$0.00',
    custom: {
      estimatedArrivalTime: '2 Business Days',
    },
    getTaxClassID: jest.fn(),
  },
];
const shippingCost = Money();
const shipmentShippingModel = {
  getApplicableShippingMethods: jest.fn(() => ({
    toArray: jest.fn(() => shippingMethods),
  })),
  getShippingCost: jest.fn(() => ({
    getAmount: jest.fn(() => shippingCost),
  })),
};
const productShippingModel = {
  getApplicableShippingMethods: jest.fn(() => ({})),
  getShippingCost: jest.fn(() => ({
    getAmount: jest.fn(() => shippingCost),
  })),
};
export const getShipmentShippingModel = jest.fn(() => shipmentShippingModel);
export const getProductShippingModel = jest.fn(() => productShippingModel);
