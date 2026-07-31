function Status(status, code, message) {
  this.status = status;
  this.code = code;
  this.message = message;
}

Status.OK = 0;
Status.ERROR = 1;

module.exports = Status;
