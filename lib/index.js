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
  var keys;
  var key;
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

  typeName = name.split('.').pop();

  if (namedArgs instanceof Array) {
    argList = [];
    customProperties = [];

    for (var i = 0, len = namedArgs.length; i < len; ++i) {
      argList.push(namedArgs[i]);
      customProperties.push('(' + namedArgs[i] + ' !== undefined) && (this.' + namedArgs[i] + ' = ' + namedArgs[i] + ');');
    }
  } else if (namedArgs !== null && typeof namedArgs === 'object') {
    argList = [];
    customProperties = [];

    keys = Object.keys(namedArgs);

    for (var i = 0, len = keys.length; i < len; ++i) {
      key = keys[i];
      argList.push(key);
      if (namedArgs[key] === undefined) {
        customProperties.push('(' + key + ' !== undefined) && (this.' + key + ' = ' + key + ');');
      } else {
        customProperties.push('this.' + key + ' = ' + key + ' !== undefined ? ' + key + ' : ' + JSON.stringify(namedArgs[key]) + ';');
      }
    }
  } else {
    argList = [ 'msg' ];
    customProperties = [ 'msg && (this.message = msg);' ];
  }

  fnBody = 'return function ' + typeName + '(' + argList.join(', ') + ') {' +
    'if (!(this instanceof ' + typeName + ')) {' +
      'return new ' + typeName + '(' + argList.join(', ') + ');' +
    '}' +
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
