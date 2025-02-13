/**
 * @jest-environment jsdom
 */

const {
  callPaymentFromComponent,
  saveShopperDetails,
  makeExpressPaymentDetailsCall,
  handleShippingAddressChange,
  handleShippingOptionChange,
  getPaypalButtonConfig,
} = require('../paypalExpress.js')
const helpers = require('../adyen_checkout/helpers');

describe('paypal express', () => {
  describe('callPaymentFromComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.resetModules();
  });
  it('should make successful payments call for express', async () => {
    const start = jest.fn();
    global.$.spinner = jest.fn(() => {return {
      start: start
    }})
    global.$.ajax = jest.fn().mockImplementation(({ success }) => {
		success({
        fullResponse: {action : {}}
      })
    });
    const component = {
      handleError: jest.fn(),
      handleAction: jest.fn()
    }
    await callPaymentFromComponent({}, component);
    expect(start).toHaveBeenCalledTimes(1);
    expect(component.handleAction).toHaveBeenCalledTimes(1);
    expect(component.handleError).not.toHaveBeenCalled();
  })
  it('should handle failed payments call for express when response is not ok', async () => {
    const start = jest.fn();
    global.$.spinner = jest.fn(() => {return {
      start: start
    }})
    global.$.ajax = jest.fn().mockImplementation(({ success }) => {
		success({})
    });
    const component = {
      handleError: jest.fn(),
      handleAction: jest.fn()
    }
    await callPaymentFromComponent({}, component);
    expect(start).toHaveBeenCalledTimes(1);
    expect(component.handleError).toHaveBeenCalledTimes(1);
    expect(component.handleAction).not.toHaveBeenCalled();
  })
  it('should handle failed payments call for express when response is ok but there is no "action" in response', async () => {
    const start = jest.fn();
    global.$.spinner = jest.fn(() => {return {
      start: start
    }})
    global.fetch = jest.fn().mockRejectedValueOnce({})
    const component = {
      handleError: jest.fn(),
      handleAction: jest.fn()
    }
    await callPaymentFromComponent({}, component);
    expect(start).toHaveBeenCalledTimes(1);
    expect(component.handleError).toHaveBeenCalledTimes(1);
    expect(component.handleAction).not.toHaveBeenCalled();
  })
})
  describe('saveShopperDetails', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.resetModules();
    });
    it('should make successful save shopper data call', async () => {
      const stop = jest.fn();
      global.$.spinner = jest.fn(() => {return {
        stop: stop
      }})
      $.ajax = jest.fn().mockImplementation(({success}) => Promise.resolve(success()));
      const actions = {
        resolve: jest.fn()
      }
      await saveShopperDetails({}, actions);
      expect(actions.resolve).toHaveBeenCalledTimes(1);
      expect(stop).not.toHaveBeenCalled();
    })
    it('should stop spinner if save shopper data call fails', async () => {
      const stop = jest.fn();
      global.$.spinner = jest.fn(() => {return {
        stop: stop
      }})
      $.ajax = jest.fn().mockImplementation(({error}) => Promise.resolve(error()));
      const actions = {
        resolve: jest.fn()
      }
      await saveShopperDetails({}, actions);
      expect(stop).toHaveBeenCalledTimes(1);
      expect(actions.resolve).not.toHaveBeenCalled();
    })
  })
  describe('makeExpressPaymentDetailsCall', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.resetModules();
    });
    it('should make successful express payment details call', async () => {
      const stop = jest.fn();
      const createShowConfirmationForm = jest.fn();
      const setOrderFormData = jest.fn();
      global.$.spinner = jest.fn(() => {return {
        stop: stop
      }})
      helpers.setOrderFormData = setOrderFormData;
      helpers.createShowConfirmationForm = createShowConfirmationForm;
      $.ajax = jest.fn().mockImplementation(({success}) => Promise.resolve(success()));

      await makeExpressPaymentDetailsCall({});
      expect(createShowConfirmationForm).toHaveBeenCalledTimes(1);
      expect(setOrderFormData).toHaveBeenCalledTimes(1);
      expect(stop).not.toHaveBeenCalled();
    })
    it('should stop spinner if express payment details call fails', async () => {
      const stop = jest.fn();
      const createShowConfirmationForm = jest.fn();
      const setOrderFormData = jest.fn();
      global.$.spinner = jest.fn(() => {return {
        stop: stop
      }})
      helpers.setOrderFormData = setOrderFormData;
      helpers.createShowConfirmationForm = createShowConfirmationForm;
      $.ajax = jest.fn().mockImplementation(({error}) => Promise.resolve(error()));

      await makeExpressPaymentDetailsCall({});
      expect(stop).toHaveBeenCalledTimes(1);
      expect(createShowConfirmationForm).not.toHaveBeenCalled();
      expect(setOrderFormData).not.toHaveBeenCalled();
    })
  })
  describe('handleShippingAddressChange', () => {
    window.shippingMethodsUrl= 'test_url';
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.resetModules();
    });
    it('should make successful shipping address change call', async () => {
      const data = {
        shippingAddress: {
          city: 'Amsterdam',
          country: 'Netherlands',
          countryCode: 'NL',
          state: 'AMS',
          postalCode: '1001',
        },
        errors: {
          ADDRESS_ERROR: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      const request = {
        url: 'test_url',
        type: 'POST',
        data: {
          csrf_token: undefined,
          data: JSON.stringify({
            paymentMethodType: 'paypal',
            currentPaymentData: 'test_paymentData',
            address: {
              city: 'Amsterdam',
              country: 'Netherlands',
              countryCode: 'NL',
              stateCode: 'AMS',
              postalCode: '1001',
            }
          }),
        },
        async: false,
      }

      await handleShippingAddressChange(data, actions, component);
      expect(global.$.ajax).toHaveBeenCalledWith(expect.objectContaining(request));
    })
    it('should not make shipping address change call if no shipping address is present', async () => {
      const data = {
        errors: {
          ADDRESS_ERROR: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn(() => ({paymentData: 'test_paymentData', status: 'success'}))
      })

      await handleShippingAddressChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
    it('should handle failed shipping address change call', async () => {
      const data = {
        shippingAddress: {
          city: 'Amsterdam',
          country: 'Netherlands',
          countryCode: 'NL',
          state: 'AMS',
          postalCode: '1001',
        },
        errors: {
          ADDRESS_ERROR: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockRejectedValueOnce({})

      await handleShippingAddressChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
    it('should handle shipping address change call when response is not ok', async () => {
      const data = {
        shippingAddress: {
          city: 'Amsterdam',
          country: 'Netherlands',
          countryCode: 'NL',
          state: 'AMS',
          postalCode: '1001',
        },
        errors: {
          ADDRESS_ERROR: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: jest.fn(() => ({paymentData: 'test_paymentData', status: 'success'}))
      })

      await handleShippingAddressChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
    it('should handle shipping address change call when status is failed', async () => {
      const data = {
        shippingAddress: {
          city: 'Amsterdam',
          country: 'Netherlands',
          countryCode: 'NL',
          state: 'AMS',
          postalCode: '1001',
        },
        errors: {
          ADDRESS_ERROR: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: jest.fn(() => ({paymentData: 'test_paymentData', status: 'failed'}))
      })

      await handleShippingAddressChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
    it('should handle shipping address change call when paymentData is not returned', async () => {
      const data = {
        shippingAddress: {
          city: 'Amsterdam',
          country: 'Netherlands',
          countryCode: 'NL',
          state: 'AMS',
          postalCode: '1001',
        },
        errors: {
          ADDRESS_ERROR: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: jest.fn(() => ({ status: 'success'}))
      })

      await handleShippingAddressChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
  })
  describe('handleShippingOptionChange', () => {
    window.selectShippingMethodUrl= 'test_url';
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.resetModules();
    });
    it('should make successful shipping option change call', async () => {
      const data = {
        selectedShippingOption: {
          id: 'test',
        },
        errors: {
          METHOD_UNAVAILABLE: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }

      const request = {
        url: 'test_url',
        async: false,
        type: 'POST',
        success: expect.any(Function),
        error: expect.any(Function),
        data: {
          csrf_token: undefined,
          data: JSON.stringify({
            paymentMethodType: 'paypal',
            currentPaymentData: 'test_paymentData',
            methodID: 'test'
          })
        },
      }

      await handleShippingOptionChange(data, actions, component);
      expect(global.$.ajax).toHaveBeenCalledWith(request);
    })
    it('should not make shipping option change call if no shipping option is present', async () => {
      const data = {
        errors: {
          METHOD_UNAVAILABLE: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn(() => ({paymentData: 'test_paymentData', status: 'success'}))
      })

      await handleShippingOptionChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
    it('should handle failed shipping options change call', async () => {
      const data = {
        selectedShippingOption: {
          id: 'test',
        },
        errors: {
          METHOD_UNAVAILABLE: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockRejectedValueOnce({})

      await handleShippingOptionChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
    it('should handle shipping option change call when response is not ok', async () => {
      const data = {
        selectedShippingOption: {
          id: 'test',
        },
        errors: {
          METHOD_UNAVAILABLE: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: jest.fn(() => ({paymentData: 'test_paymentData', status: 'success'}))
      })

      await handleShippingOptionChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
    it('should handle shipping option change call when status is failed', async () => {
      const data = {
        selectedShippingOption: {
          id: 'test',
        },
        errors: {
          METHOD_UNAVAILABLE: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: jest.fn(() => ({paymentData: 'test_paymentData', status: 'failed'}))
      })

      await handleShippingOptionChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
    it('should handle shipping option change call when paymentData is not returned', async () => {
      const data = {
        selectedShippingOption: {
          id: 'test',
        },
        errors: {
          METHOD_UNAVAILABLE: 'test_error'
        }
      }
      const actions = {
        reject: jest.fn()
      }
      const component = {
        updatePaymentData: jest.fn(),
        paymentData: 'test_paymentData'
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: jest.fn(() => ({ status: 'success'}))
      })

      await handleShippingOptionChange(data, actions, component);
      expect(actions.reject).toHaveBeenCalledTimes(1);
      expect(component.updatePaymentData).not.toHaveBeenCalled();
    })
  })
  describe('getPaypalButtonConfig',() => {
    window.returnUrl = 'test_returnUrl';
    window.basketAmount = '{"currency":"USD","value":1000}';
    beforeEach(() => {
      jest.clearAllMocks();
    });
    afterEach(() => {
      jest.resetModules();
    });
    it('should return config when review page is not enabled',() => {
      const paypalButtonConfig = getPaypalButtonConfig({});
      expect(paypalButtonConfig).toMatchSnapshot();
    })
    it('should return config when review page is enabled',() => {
      window.paypalReviewPageEnabled = true;
      const paypalButtonConfig = getPaypalButtonConfig({});
      expect(paypalButtonConfig).toMatchSnapshot();
    })
  })
})
