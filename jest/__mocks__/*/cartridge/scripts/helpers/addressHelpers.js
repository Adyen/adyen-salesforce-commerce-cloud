export const gatherShippingAddresses = jest.fn((order) => ([
    'mockedAddress1', 'mockedAddress2'
]));

export const checkIfAddressStored = jest.fn();
export const saveAddress = jest.fn();
export const generateAddressName = jest.fn();