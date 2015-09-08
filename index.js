/**
Module Error Factory
*/


const ERR_MSG_TOKENS = /\{\{([^\}]+)\}\}/g;
const ARG_EXTRACT_PATTERN = /^function [\w\-_]*\(([^\)]*)\)/;
const ARG_SPLITTER_PATTERN = /\s*,\s*/;

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
Create a new error class with the specified name and argument/properties
configuration. Optionally, the error may extend the given type
*/
function errorFactory(name, config, baseType) {
  var CustomError;
  var keys;
  var key;
  var argList = [];
  var customProperties = '';
  var definedProperties;
  var fnArgs;
  var fnBody;
  var typeName;

  if (!name) {
    throw new Error('Empty error name');
  } else if (typeof name !== 'string') {
    throw new Error('Error name must be a string');
  } else if (!varValidator.isValid(name, varValidatorOptions)) {
    throw new Error('Invalid error name `' + name + '`');
  } else if (baseType != null && !(baseType === Error || baseType.prototype instanceof Error)) {
    throw new Error('Invalid base type `' + baseType + '`');
  }

  if (cache[name]) {
    return cache[name];
  }

  typeName = name.split('.').pop();
  definedProperties = {
    message: {
      enumerable: true,
      configurable: false,
      get: errorMessageRenderer,
      set: errorMessage
    }
  };

  if (config instanceof Array) {
    for (var i = 0, len = config.length; i < len; ++i) {
      customProperties = customProperties + generateCustomProperty(config[i], undefined, definedProperties, argList);
    }
  } else if (config !== null && typeof config === 'object') {
    if ('_message' in config) {
      throw new Error('Property "_message" should be "message": ' + JSON.stringify(config._message));
    } else if ('stack' in config) {
      throw new Error('Property "stack" is an invalid argument name: ' + JSON.stringify(config.stack));
    }

    keys = Object.keys(config);

    for (var i = 0, len = keys.length; i < len; ++i) {
      key = keys[i];

      customProperties = customProperties + generateCustomProperty(key, config[key], definedProperties, argList);
    }
  }

  if (!customProperties) {
    // NOTE : unless explicit argument are provided, this is mocking the Error default behaviour
    customProperties = customProperties + generateCustomProperty('message', undefined, definedProperties, argList);
  }

  fnArgs = 'definedProperties,stackTraceCleanup' +
           (baseType ? (',' + baseType.name) : '');

  fnBody = 'return function ' + typeName + '(' + argList.join(',') + '){' +
    'if(!(this instanceof ' + typeName + ')){' +
      'return new ' + typeName + '(' + argList.join(',') + ');' +
    '}' +
    customProperties +
    'this._message=this._message||this.message||"' + typeName + '";' +
    (baseType
      ? buildSuperConstructorCall(baseType, argList)
      : 'Error.apply(this,arguments);' +
        'Object.defineProperties(this,definedProperties);' +
        'Error.captureStackTrace(this,this.constructor);' +
        'this.stack=stackTraceCleanup(this.stack);') +
  '}';

  CustomError = Function(fnArgs, fnBody)(definedProperties, stackTraceCleanup, baseType);

  util.inherits(CustomError, baseType || Error);

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


function generateCustomProperty(property, value, definedProperties, argList) {
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
      return '(' + property + '!==undefined)&&(this.' + property + '=' + property + ');';
    } else {
      return 'this.' + property + '=' + property + '!==undefined?' + property + ':' + JSON.stringify(value) + ';';
    }
  } else {
    return '';
  }
}


function buildSuperConstructorCall(base, args) {
  var undef = 'undefined';
  var baseArgs = ARG_EXTRACT_PATTERN.exec(base.toString())[1].split(ARG_SPLITTER_PATTERN).filter(function (v) {
    return v;
  }).map(function (arg) {
    return (args.indexOf(arg) > -1) ? arg : undef;
  });

  while (baseArgs.length && baseArgs[baseArgs.length - 1] === undef) {
    baseArgs.pop();
  }

  return base.name + '.call(this,' + baseArgs.join(',') + ');';
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
