const handleFraudDetection = require('../fraud');

let order;
let req;
let res;
let emit;
beforeEach(() => {
  order = {};
  req = { session: { privacyCache: { set: jest.fn() } } };
  res = { json: jest.fn() };
  emit = jest.fn();
});

describe('Fraud', () => {
  it('should return json response with error when fraud status is "fail"', () => {
    const isSuccessful = handleFraudDetection(
      { status: 'fail' },
      order,
      { req, res },
      emit,
    );

    expect(isSuccessful).toBeFalsy();
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(emit).toHaveBeenCalledWith('route:Complete');
  });
  it('should succeed when fraud status is not "fail"', () => {
    const isSuccessful = handleFraudDetection(
      { status: 'success' },
      order,
      { req, res },
      emit,
    );
    expect(isSuccessful).toBeTruthy();
    expect(emit).toHaveBeenCalledTimes(0);
  });
});
