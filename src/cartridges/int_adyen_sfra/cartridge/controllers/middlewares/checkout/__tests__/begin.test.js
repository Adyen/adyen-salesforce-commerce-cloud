/* eslint-disable global-require */
const {
  checkout: { begin },
} = require('../../index');

let res;
let req;
beforeEach(() => {
  jest.clearAllMocks();
  req = { currentCustomer: { raw: { isAuthenticated: jest.fn(() => false) } } };
  res = { getViewData: jest.fn(() => ({})), setViewData: jest.fn() };
});

describe('Begin', () => {
  it('should update saved cards', () => {
    const {
      updateSavedCards,
    } = require('*/cartridge/scripts/updateSavedCards');
    req.currentCustomer.raw.isAuthenticated.mockImplementation(() => true);
    begin(req, res, jest.fn());
    expect(updateSavedCards).toBeCalledTimes(1);
  });
  it('should set view data', () => {
    begin(req, res, jest.fn());
    expect(res.setViewData.mock.calls).toMatchSnapshot();
  });
});
