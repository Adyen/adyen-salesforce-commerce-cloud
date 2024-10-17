module.exports = {
  analyticsEventObjectId: 'AdyenAnalyticsEvents',
  eventType: {
    START: 'START',
    END: 'END',
  },
  eventStatus: {
    EXPECTED: 'EXPECTED',
    UNEXPECTED: 'UNEXPECTED',
  },
  eventCode: {
    ERROR: 'error',
    INFO: 'info',
    LOG: 'log',
  },
  processingStatus: {
    NOT_PROCESSED: 'NOT_PROCESSED',
    PROCESSED: 'PROCESSED',
    SKIPPED: 'SKIPPED',
  },
};
