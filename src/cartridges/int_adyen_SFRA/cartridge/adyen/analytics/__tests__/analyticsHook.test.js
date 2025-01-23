const URLRedirectMgr = require('dw/web/URLRedirectMgr');
const { createAnalyticsEvent } = require('*/cartridge/adyen/analytics/analyticsEvents');
const {
  isAdyenAnalyticsEnabled,
} = require('*/cartridge/adyen/utils/adyenConfigs');
const {registerRoute, onStartHandler, onCompleteHandler, isUsedByAdyen } = require('../analyticsHook');
const { redirectOrigin } = require("../../../../../../../jest/__mocks__/dw/web/URLRedirectMgr");

describe('analyticsHook', () => {
  afterEach(() => {
    jest.clearAllMocks();
  })
  it('should register eventlistener', () => {
    const route = {
      on: jest.fn(),
    }
    registerRoute(route);
    expect(route.on).toHaveBeenCalledTimes(2);
    expect(route.on).toHaveBeenCalledWith('route:Start', expect.any(Function));
    expect(route.on).toHaveBeenCalledWith('route:Complete', expect.any(Function));
  })
  it('should create Start event when onStartHandler is called', () => {
    const req = {
      path: '/Adyen-GetPaymentMethods'
    };
    onStartHandler(req);
    expect(createAnalyticsEvent).toHaveBeenCalled();
    expect(createAnalyticsEvent).toHaveBeenCalledWith('mocked_sessionID','Adyen-GetPaymentMethods', 'expectedStart', 'EXPECTED', 'info');
  })
  it('should not create Start event when adyen analytics is disabled in BM', () => {
    const req = {
      path: '/Adyen-GetPaymentMethods'
    };
    isAdyenAnalyticsEnabled.mockImplementationOnce(() => false);
    onStartHandler(req);
    expect(createAnalyticsEvent).not.toHaveBeenCalled();
  })
  it('should not create Start event when route is not used by adyen', () => {
    const req = {
      path: '/Product-Show'
    };
    onStartHandler(req);
    expect(createAnalyticsEvent).not.toHaveBeenCalled();
  })
  it('should create End event when onCompleteHandler is called', () => {
    const req = {
      path: '/Adyen-GetPaymentMethods'
    };
    const res = {
      viewData: {}
    };
    onCompleteHandler(req, res);
    expect(createAnalyticsEvent).toHaveBeenCalled();
    expect(createAnalyticsEvent).toHaveBeenCalledWith('mocked_sessionID','Adyen-GetPaymentMethods', 'expectedEnd', 'EXPECTED', 'info');
  })
  it('should create End event with unexpected status when onCompleteHandler is called for error in route', () => {
    const req = {
      path: '/Adyen-GetPaymentMethods'
    };
    const res = {
      viewData: {error: true}
    };
    onCompleteHandler(req, res);
    expect(createAnalyticsEvent).toHaveBeenCalled();
    expect(createAnalyticsEvent).toHaveBeenCalledWith('mocked_sessionID','Adyen-GetPaymentMethods', 'unexpectedEnd', 'UNEXPECTED', 'info');
  })
  it('should not create End event when adyen analytics is disabled in BM', () => {
    const req = {
      path: '/Adyen-GetPaymentMethods'
    };
    const res = {
      viewData: {}
    };
    isAdyenAnalyticsEnabled.mockImplementationOnce(() => false);
    onCompleteHandler(req, res);
    expect(createAnalyticsEvent).not.toHaveBeenCalled();
  })
  it('should not create End event when route is not used by adyen', () => {
    const req = {
      path: '/Product-Show'
    };
    const res = {
      viewData: {}
    };
    onCompleteHandler(req, res);
    expect(createAnalyticsEvent).not.toHaveBeenCalled();
  })
})

describe('isUsedByAdyen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  })
  it('should return true if Controller has no specific routes mentioned', () => {
    const req = {
      path: '/Adyen-GetPaymentMethods'
    };
    expect(isUsedByAdyen(req)).toBe(true);
  })
  it('should return true only for mentioned routes for a controller', () => {
    const req = {
      path: '/Cart-MiniCartShow'
    };
    expect(isUsedByAdyen(req)).toBe(true);
    req.path = '/Cart-AddProduct';
    expect(isUsedByAdyen(req)).toBe(false);
  })
  it('should return true if rule is true for routes with rule', () => {
    const req = {
      path: '/RedirectUrl-Start'
    };
    expect(isUsedByAdyen(req)).toBe(true);
    URLRedirectMgr.redirectOrigin.match.mockImplementationOnce(() => false);
    expect(isUsedByAdyen(req)).toBe(false);
  })
})
