/**
Module Error Factory
*/

var util = require('util');

/**
Expose factory method
*/
module.exports = errorFactory;


/**
Create a new error class with the specified name
*/
function errorFactory(name, namedArgs) {
  var CustomError;
  var argList;
  var customProperties;
  var fnBody;

  if (!name) {
    throw new Error('Empty error name');
  }
  if (typeof name !== 'string') {
    throw new Error('Error name must be a string');
  }

  if (!(namedArgs instanceof Array)) {
    argList = [ 'msg' ];
    customProperties = [ 'msg && (this.message = msg);' ];
  } else {
    argList = [];
    customProperties = [];

    for (var i = 0, len = namedArgs.length; i < len; ++i) {
      argList.push(namedArgs[i]);
      customProperties.push(namedArgs[i] + ' && (this.' + namedArgs[i] + ' = ' + namedArgs[i] + ');');
    }
  }

  fnBody = 'return function ' + name + '(' + argList.join(', ') + ') {' +
    customProperties.join('') +
    'Error.apply(this, arguments);' +
    'Error.captureStackTrace(this, this.constructor);' +
  '}';

  CustomError = Function('', fnBody)();

  util.inherits(CustomError, Error);
  CustomError.prototype.name = name;

  return CustomError;
}
