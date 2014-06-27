/**
Module Error Factory
*/


const ERR_MSG_TOKENS = /\{\{([^\}]+)\}\}/g;

var util = require('util');
var nameValid = require('./name-validator');

/**
Error cache
*/
var cache = {};

/**
Auto update stack trace on message update
*/
var autoUpdateStack = false;



/**
Expose factory method
*/
module.exports = errorFactory;

/**
Expose autoUpdateStack flag on message update
*/
Object.defineProperty(module.exports, 'autoUpdateStack', {
  enumerable: true,
  configurable: false,
  get: function isAutoUpdateStack() {
    return autoUpdateStack;
  },
  set: function setAutoUpdateStack(b) {
    autoUpdateStack = b;
  }
});


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
    throw new Error('Invalid error name `' + name + '`');
  }

  if (cache[name]) {
    return cache[name];
  }

  typeName = name.split('.').pop();

  if (namedArgs instanceof Array) {
    argList = [];
    customProperties = [];

    for (var i = 0, len = namedArgs.length; i < len; ++i) {
      if (nameValid(namedArgs[i])) {
        argList.push(namedArgs[i]);
        customProperties.push('(' + namedArgs[i] + ' !== undefined) && (this.' + namedArgs[i] + ' = ' + namedArgs[i] + ');');
      } else {
        throw new Error('Invalid named argument : `' + String(namedArgs[i]));
      }
    }
  } else if (namedArgs !== null && typeof namedArgs === 'object') {
    argList = [];
    customProperties = [];

    keys = Object.keys(namedArgs);

    for (var i = 0, len = keys.length; i < len; ++i) {
      key = keys[i];
      if (nameValid(key)) {
        argList.push(key);
        if (namedArgs[key] === undefined) {
          customProperties.push('(' + key + ' !== undefined) && (this.' + key + ' = ' + key + ');');
        } else {
          customProperties.push('this.' + key + ' = ' + key + ' !== undefined ? ' + key + ' : ' + JSON.stringify(namedArgs[key]) + ';');
        }
      } else {
        throw new Error('Invalid named argument : `' + String(key));
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
    'this._message = this.message || "' + typeName + '";' +
    'Object.defineProperty(this, "message", {' +
      'enumerable:true,' +
      'configurable:false,' +
      'get:getMessage,' +
      'set:setMessage' +
    '});' +
    'Error.apply(this, arguments);' +
    'Error.captureStackTrace(this, this.constructor);' +
    'this.stack = stackTraceCleanup(this.stack);' +
  '}';

  CustomError = Function('getMessage,setMessage,stackTraceCleanup', fnBody)(errorMessageRenderer, errorMessage, stackTraceCleanup);

  util.inherits(CustomError, Error);

  Object.defineProperties(CustomError.prototype, {
    'name': {
      enumerable: true,
      configurable: false,
      writable: false,
      value: typeName
    },
    'canonicalName': {
      enumerable: true,
      configurable: false,
      writable: false,
      value: name
    }
  });
  Object.defineProperties(CustomError, {
    'canonicalName': {
      enumerable: true,
      configurable: false,
      writable: false,
      value: name
    }
  });

  // save to cache
  cache[name] = CustomError;

  return CustomError;
}


function errorMessageRenderer() {
  var msg = this._message || this.name;
  var data = this.messageData;

  if (data) {
    return msg.replace(ERR_MSG_TOKENS, function (m, t) {
      return t in data ? data[t] : m;
    });
  }

  return msg;
}

function errorMessage(message) {
  var oldMsg;

  if (autoUpdateStack) {
    oldMsg = this.message;
  }

  this._message = message;

  if (autoUpdateStack) {
    this.stack = this.stack.replace(oldMsg, this.message);
  }
}


function stackTraceCleanup(stack) {
  stack = stack.split('\n');
  stack.splice(1, 1);
  return stack.join('\n');
}
