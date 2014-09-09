/**
Module Error Factory
*/


const ERR_MSG_TOKENS = /\{\{([^\}]+)\}\}/g;

var util = require('util');
var varValidator = require('var-validator');

var varValidatorOptions = {
  enableScope: true,
  enableBrackets: false,
  allowLowerCase: true,
  allowUpperCase: true
};

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
Expose ErrorProperty
*/
module.exports.ErrorProperty = ErrorProperty;


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
  var argList = [];
  var customProperties = '';
  var definedProperties = {
    message: {
      enumerable: true,
      configurable: false,
      get: errorMessageRenderer,
      set: errorMessage
    }
  };
  var fnBody;
  var typeName;


  function addCustomProperty(property, value) {
    var code;
    var constructorArgument = true;

    if (!varValidator.isValid(property, varValidatorOptions)) {
      throw new Error('Invalid named argument : `' + String(property));
    }

    if (value instanceof ErrorProperty) {
      constructorArgument = value.constructorArgument;

      definedProperties[property] = value.description;

      if (constructorArgument) {
        value = value.description.value;

        delete definedProperties[property].value;
      }
    }

    if (constructorArgument) {
      argList.push(property);

      if (value === undefined) {
        code = '(' + property + '!==undefined)&&(this.' + property + '=' + property + ');';
      } else {
        code ='this.' + property + '=' + property + '!==undefined?' + property + ':' + JSON.stringify(value) + ';';
      }

      customProperties = customProperties + code;
    }
  }

  if (!name) {
    throw new Error('Empty error name');
  } else if (typeof name !== 'string') {
    throw new Error('Error name must be a string');
  } else if (!varValidator.isValid(name, varValidatorOptions)) {
    throw new Error('Invalid error name `' + name + '`');
  }

  if (cache[name]) {
    return cache[name];
  }

  typeName = name.split('.').pop();

  if (namedArgs instanceof Array) {
    for (var i = 0, len = namedArgs.length; i < len; ++i) {
      addCustomProperty(namedArgs[i]);
    }
  } else if (namedArgs !== null && typeof namedArgs === 'object') {
    if ('_message' in namedArgs) {
      throw new Error('Property "_message" should be "message": ' + JSON.stringify(namedArgs._message));
    } else if ('stack' in namedArgs) {
      throw new Error('Property "stack" cannot be specified: ' + JSON.stringify(namedArgs.stack));
    }

    keys = Object.keys(namedArgs);

    for (var i = 0, len = keys.length; i < len; ++i) {
      key = keys[i];

      addCustomProperty(key, namedArgs[key]);
    }
  }

  if (!customProperties) {
    // NOTE : unless explicit argument are provided, this is mocking the Error default behaviour
    addCustomProperty('message');
  }

  fnBody = 'return function ' + typeName + '(' + argList.join(', ') + '){' +
    'if(!(this instanceof ' + typeName + ')){' +
      'return new ' + typeName + '(' + argList.join(', ') + ');' +
    '}' +
    customProperties +
    'this._message=this.message||"' + typeName + '";' +
    'Error.apply(this,arguments);' +
    'Object.defineProperties(this,definedProperties);' +
    'Error.captureStackTrace(this,this.constructor);' +
    'this.stack=stackTraceCleanup(this.stack);' +
  '}';

  CustomError = Function('definedProperties,stackTraceCleanup', fnBody)(definedProperties, stackTraceCleanup);

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


/**
Contains information about an Error property

@param description {Object}        an object compatible with Object.defineProperty
@param constructorArgument {bool}  tells if this property is a constructor named argument (default false)
*/
function ErrorProperty(description, constructorArgument) {
  if (!(this instanceof ErrorProperty)) {
    return new ErrorProperty(description, constructorArgument);
  }

  if ((description === null) || (description.__proto__.constructor !== Object)) {
    throw new TypeError('Property description must be an object: ' + JSON.stringify(description));
  }

  this.description = description;
  this.constructorArgument = constructorArgument;
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
