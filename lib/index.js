/**
Module Error Factory
*/

var util = require('util');
var nameValid = require('./name-validator');

/**
Error cache
*/
var cache = {};


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
  var typeName;

  if (!name) {
    throw new Error('Empty error name');
  } else if (typeof name !== 'string') {
    throw new Error('Error name must be a string');
  } else if (!nameValid(name)) {
    throw new Error('Invalid exception name `' + name + '`');
  }

  if (cache[name]) {
    return cache[name];
  }

  typeName = _getTypeName(name);

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

  fnBody = 'return function ' + typeName + '(' + argList.join(', ') + ') {' +
    customProperties.join('') +
    'Error.apply(this, arguments);' +
    'Error.captureStackTrace(this, this.constructor);' +
  '}';

  CustomError = Function('', fnBody)();

  util.inherits(CustomError, Error);
  CustomError.prototype.name = typeName;
  CustomError.fullName = name;

  // save to cache
  cache[name] = CustomError;

  return CustomError;
}


function _getTypeName(name) {
  return name.split('.').pop();
}
