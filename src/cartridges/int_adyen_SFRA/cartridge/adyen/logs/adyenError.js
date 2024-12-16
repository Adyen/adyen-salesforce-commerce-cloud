/* eslint-disable max-classes-per-file */
class AdyenError extends Error {
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = this.constructor.name;
  }
}

module.exports = {
  AdyenError,
};
