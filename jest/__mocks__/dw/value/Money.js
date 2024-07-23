function Money(isAvailable) {
  return {
    available: isAvailable,
    value: '10.99',
    currency: 'USD',
    getDecimalValue() {
      return '10.99';
    },
    getValue() {
      return '10.99';
    },
    getCurrencyCode() {
      return 'USD';
    },
    subtract() {
      return new Money(isAvailable);
    },
    multiply() {
      return new Money(isAvailable);
    },
    add() {
      return new Money(isAvailable);
    },
    addRate() {
      return new Money(isAvailable);
    },
  };
}

module.exports = Money;
