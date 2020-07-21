export const getLogger = jest.fn((name) => ({
  error: jest.fn((message) => `${name}: ${message}`),
}));
