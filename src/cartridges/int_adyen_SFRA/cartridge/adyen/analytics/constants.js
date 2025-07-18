module.exports = {
  analyticsEventObjectId: 'AdyenAnalyticsEvents',
  pluginType: 'salesforceCommerceCloud',
  errorType: 'Plugin',
  eventType: {
    EXPECTED_START: 'expectedStart',
    UNEXPECTED_START: 'unexpectedStart',
    EXPECTED_END: 'expectedEnd',
    UNEXPECTED_END: 'unexpectedEnd',
  },
  eventCode: {
    ERROR: 'errors',
    INFO: 'info',
    LOG: 'logs',
  },
  processingStatus: {
    NOT_PROCESSED: 'NOT_PROCESSED',
    PROCESSED: 'PROCESSED',
    SKIPPED: 'SKIPPED',
  },
  eventSource: {
    CONFIGURATION_TIME: 'Adyen-ConfigurationTime',
  },
  EVENT_LIMIT: 1000,
};
