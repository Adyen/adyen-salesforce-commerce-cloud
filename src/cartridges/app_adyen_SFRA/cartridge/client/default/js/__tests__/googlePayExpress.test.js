/**
 * @jest-environment jsdom
 */
const {formatCustomerObject} = require('../googlePayExpress');
const {getTransactionInfo} = require('../googlePayExpress'); // Adjust the path as needed

describe('getTransactionInfo', () => {
  it('should correctly format transaction information', () => {
    const newCalculation = {
      locale: 'en-US',
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

    const expectedOutput = {
      countryCode: 'US',
      currencyCode: 'USD',
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: '65.00',
    };

    const result = getTransactionInfo(newCalculation);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle missing or empty fields', () => {
    const newCalculation = {
      locale: 'fr-FR',
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

    const expectedOutput = {
      countryCode: 'FR',
      currencyCode: 'EUR',
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: '0.00',
    };

    const result = getTransactionInfo(newCalculation);
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
        countryCode: 'USA',
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
            countryCode: 'USA',
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
            value: 'USA',
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
          value: 'USA',
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
