function AdyenError(message) {
  this.message = message || 'Something went wrong!';
  this.name = this.constructor.name;
  const error = new Error(this.message);
  this.stack = error.stack;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, AdyenError);
  }
}
AdyenError.prototype = Object.create(Error.prototype);
AdyenError.prototype.constructor = AdyenError;

module.exports = {
  AdyenError,
};
