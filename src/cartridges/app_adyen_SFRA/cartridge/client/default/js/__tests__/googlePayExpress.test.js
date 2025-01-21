/**
 * @jest-environment jsdom
 */
const {formatCustomerObject} = require('../googlePayExpress');
const {getTransactionInfo} = require('../googlePayExpress'); // Adjust the path as needed

describe('getTransactionInfo', () => {
  it('should correctly format transaction information', () => {
    const newCalculation = {
      totals: {
        totalShippingCost: '$10.00',
        totalTax: '$5.00',
        subTotal: '$50.00',
      },
      grandTotalAmount: {
        value: '65.00',
        currency: 'USD',
      },
    };

    const shippingMethodsData = {
      locale: 'en-US', // Example locale
    };

    const expectedOutput = {
      displayItems: [
        {
          price: '10.00',
          label: 'Shipping',
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
        {
          price: '5.00',
          label: 'Tax',
          type: 'TAX',
          status: 'FINAL',
        },
        {
          price: '50.00',
          label: 'Subtotal',
          type: 'SUBTOTAL',
          status: 'FINAL',
        },
      ],
      countryCode: 'US', // Extracted from locale
      currencyCode: 'USD', // From grandTotalAmount
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: '65.00', // From grandTotalAmount
    };

    const result = getTransactionInfo(newCalculation, shippingMethodsData);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle missing or empty fields', () => {
    const newCalculation = {
      totals: {
        totalShippingCost: '$0.00',
        totalTax: '$0.00',
        subTotal: '$0.00',
      },
      grandTotalAmount: {
        value: '0.00',
        currency: 'EUR',
      },
    };

    const shippingMethodsData = {
      locale: 'fr-FR',
    };

    const expectedOutput = {
      displayItems: [
        {
          price: '0.00',
          label: 'Shipping',
          type: 'LINE_ITEM',
          status: 'FINAL',
        },
        {
          price: '0.00',
          label: 'Tax',
          type: 'TAX',
          status: 'FINAL',
        },
        {
          price: '0.00',
          label: 'Subtotal',
          type: 'SUBTOTAL',
          status: 'FINAL',
        },
      ],
      countryCode: 'FR', // Extracted from locale
      currencyCode: 'EUR', // From grandTotalAmount
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: '0.00', // From grandTotalAmount
    };

    const result = getTransactionInfo(newCalculation, shippingMethodsData);
    expect(result).toEqual(expectedOutput);
  });
});

describe('formatCustomerObject', () => {
  it('should correctly format customer data', () => {
    const customerData = {
      shippingAddress: {
        name: 'John Doe',
        address1: '123 Main St',
        address2: 'Apt 4B',
        locality: 'New York',
        country: 'USA',
        administrativeArea: 'NY',
        postalCode: '10001',
        phoneNumber: '123-456-7890',
      },
      paymentMethodData: {
        info: {
          billingAddress: {
            address1: '456 Elm St',
            address2: null,
            locality: 'Brooklyn',
            country: 'USA',
            administrativeArea: 'NY',
            postalCode: '11201',
          },
        },
      },
      email: 'johndoe@example.com',
    };

    const expectedOutput = {
      addressBook: {
        addresses: {},
        preferredAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'New York',
          countryCode: {
            displayValue: 'USA',
            value: 'NY',
          },
          firstName: 'John',
          lastName: 'Doe',
          ID: 'johndoe@example.com',
          postalCode: '10001',
          stateCode: 'NY',
        },
      },
      billingAddressDetails: {
        address1: '456 Elm St',
        address2: null,
        city: 'Brooklyn',
        countryCode: {
          displayValue: 'USA',
          value: 'NY',
        },
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '11201',
        stateCode: 'NY',
      },
      customer: {},
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        phone: '123-456-7890',
      },
    };

    const result = formatCustomerObject(customerData);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle single-word names correctly', () => {
    const customerData = {
      shippingAddress: {
        name: 'Alice', // Single-word name
        address1: '789 Pine St',
        locality: 'Los Angeles',
        country: 'USA',
        administrativeArea: 'CA',
        postalCode: '90001',
        phoneNumber: null,
      },
      paymentMethodData: {
        info: {
          billingAddress: {
            address1: null,
            locality: null,
            country: null,
            administrativeArea: null,
            postalCode: null
          }
        }
      }
    }
  });
})
