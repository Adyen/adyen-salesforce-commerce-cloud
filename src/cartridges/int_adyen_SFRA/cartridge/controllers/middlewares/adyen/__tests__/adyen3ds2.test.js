const {
  adyen: { adyen3ds2 },
} = require('../../index');

let req;
let res;
let next;

beforeEach(() => {
  next = jest.fn();
  req = {
    https: true,
    host: 'mocked_host',
    querystring: {
      resultCode: 'Authorised',
      action: 'mocked_action',
      orderNo: 'mocked_orderNo',
    },
  };

  res = { redirect: jest.fn(), render: jest.fn() };
});

describe('Adyen 3DS2', () => {
  it('should render', () => {
    adyen3ds2(req, res, next);
    expect(res.render.mock.calls).toMatchSnapshot();
  });
});
