let name;
export const fatal = jest.fn((message) => `${name}: ${message}`);
export const error = jest.fn((message) => `${name}: ${message}`);
export const debug = jest.fn((message) => `${name}: ${message}`);
export const info = jest.fn((message) => `${name}: ${message}`);
export const getLogger = jest.fn((name) => ({
  fatal,
  error,
  debug,
  info,
}));
