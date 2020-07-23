export const error = jest.fn((message) => `${name}: ${message}`);
export const getLogger = jest.fn((name) => ({
  error,
}));

export default {
  getLogger,
  error,
};
