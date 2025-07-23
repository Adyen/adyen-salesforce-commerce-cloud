module.exports = {
  ADYEN_METHODS: ['AdyenPOS', 'AdyenComponent', 'CREDIT_CARD'],
  ADYEN_PROCESSORS: ['Adyen_POS', 'Adyen_Component'],
  PROCESS_EVENTS: [
    'AUTHORISATION',
    'CANCELLATION',
    'CANCEL_OR_REFUND',
    'REFUND',
    'CAPTURE_FAILED',
    'ORDER_OPENED',
    'ORDER_CLOSED',
    'OFFER_CLOSED',
    'PENDING',
    'CAPTURE',
    'DONATION',
  ],
  UPDATE_STATUS: {
    PROCESS: 'PROCESS',
    PENDING: 'PENDING',
  },
};
