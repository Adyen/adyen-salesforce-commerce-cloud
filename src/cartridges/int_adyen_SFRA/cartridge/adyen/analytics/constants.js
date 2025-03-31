module.exports = {
  analyticsEventObjectId: 'AdyenAnalyticsEvents',
  pluginType: 'salesforceCommerceCloud',
  eventType: {
    EXPECTED_START: 'expectedStart',
    UNEXPECTED_START: 'unexpectedStart',
    EXPECTED_END: 'expectedEnd',
    UNEXPECTED_END: 'unexpectedEnd',
  },
  eventStatus: {
    EXPECTED: 'EXPECTED',
    UNEXPECTED: 'UNEXPECTED',
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
  errorType: 'Plugin',
};
