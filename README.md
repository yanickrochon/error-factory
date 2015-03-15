# Node Error Factory

[![Build Status](https://travis-ci.org/yanickrochon/error-factory.svg)](https://travis-ci.org/yanickrochon/error-factory)[![Coverage Status](https://coveralls.io/repos/yanickrochon/error-factory/badge.svg?branch=master)](https://coveralls.io/r/yanickrochon/error-factory?branch=master)

[![NPM](https://nodei.co/npm/error-factory.png?compact=true)](https://nodei.co/npm/error-factory/)

Generate valid custom error and exception classes for Node.js.


## Install

```
npm install error-factory
```


## Features

* Proper `Error` inherited prototype function (aka Class)
* Custom named error arguments
* Error type caching
* Namespaced errors
* Optional usage of `new` (i.e. `throw CustomError('Foo');`)
* Template based error messages


## Usage

```
error-factory( type:String [, null|options:Object [, baseType:Constructor]] )
```


### Simple Usage

Error types created by `error-factory` can easily be thrown and compared by the
program's logic.

```javascript
var errorFactory = require('error-factory');

var CustomException = errorFactory('CustomException');

try {
  throw CustomException('This is the error message');
} catch (e) {

  if (e instanceof CustomException) {
    console.log('Custom error was thrown!');
  } else {
    console.error(e.message);  // <-- will never get executed
  }
}
```


### Custom Error Arguments

Errors may be generated with named arguments. However, the first argument
should *always* be a message string.

```javascript
var errorFactory = require('error-factory');

var CustomException = errorFactory('CustomException', [ 'message', 'context' ]);

try {
  throw CustomException('This is the error message', { foo: 'bar' });
} catch (e) {
  console.error(e.message, e.context);
}
```


### Custom Error Argument + default values

Like the previous example, it may be possible to declare a new error type,
specifying any `undefined` argument.

A property will be set to the instance if

* The named argument is not `undefined`
* The named argument is `undefined` and the default value is not `undefined`

```javascript
var errorFactory = require('error-factory');

var CustomException = errorFactory('CustomException', {
  'message': undefined,  // named argument only, no default value
  'context': false       // if no context is given, set property to false
});

try {
  throw CustomException('Foo');
} catch (e) {
  console.error(e);
  // { message: 'Foo', context: false }
}
```


### Custom Error Arguments with description

For any case where error properties should be fine tuned, one can provide the property's defined description that will be passed to `Object.defineProperty`.

```javascript
var errorFactory = require('error-factory');

var CustomException = errorFactory('CustomException', {
  'message': errorFactory.ErrorProperty({
    writable: false
  })
});

try {
  throw CustomException('This is my message');
} catch (e) {
  // the following line will NOT change the error message
  // and will throw a TypeError in strict mode.
  e.message = 'foo';
}

```


### Parameterized error messages

All errors messages are processed for parameters. This allows errors to be
internationalized, if necessary, without reverse engineering the original message.
This feature does not affect normal error behaviour.

To enable this feature, custom error instances must set `this.messageData` with
an object to replace parameters in the message. This can be done manually, or
by using custom error arguments.

```javascript
var errorFactory = require('error-factory');

var ArgumentException = errorFactory('ArgumentException', [ 'message', 'messageData' ]);

var e = ArgumentException('Invalid argument `{{arg}}`', { arg: 'foo' });

console.log(e.message);
// Invalid argument `foo`

console.log(e._message);
// Invalid argument `{{arg}}`

// modify arguments
e.messageData.arg = 'bar';

console.log(e.message);
// Invalid argument `bar`

// localize... for example
e._message = translator(e._message, 'fr');

console.log(e.message);
// Argument non valide `bar`
```


### Stack Trace

The stack trace is generated when instanciating the `Error` instance, thus it will
not update by default when modifying the error message. However, it is possible
to auto update it with an experimental feature.

```javascript
var errorFactory = require('error-factory');

var TestError = errorFactory('TestError', [ 'message', 'messageData' ]);

// Enable auto update stack
errorFactory.autoUpdateStack = true;

var e = TestError('Test `{{arg}}`', { arg: 'foo' });

e.stack;
// -> TestError: Test `foo` ...

e.message = 'Changed `{{arg}}`';

e.stack;
// -> TestError: Changed `foo` ...
```

**!!WARNING!!** : this feature is experimental and should not be tempered with during
program execution, or results and behaviour will be undefined.


### Namespaced Errors

Because errors are cached, projects should use namespaced errors to avoid mistakenly
returning an error already defined somewhere else, with possibly different parameters,
etc. As a rule of thumb, non-namespaced errors should not define named arguments, or
use message templates, and should be reserved as low-level error types only.

```javascript
var errorFactory = require('error-factory');

var ArgumentException = errorFactory('ArgumentException');
var MyArgumentException = errorFactory('my.ArgumentException');

console.log(ArgumentException.name, MyArgumentException.name)
// ArgumentException ArgumentException

console.log(ArgumentException.fullName, MyArgumentException.fullName)
// ArgumentException my.ArgumentException

console.log(ArgumentException.name === MyArgumentException.name);
// true

console.log(ArgumentException === MyArgumentException);
// false

console.log(ArgumentException === errorFactory('ArgumentException'));
// true
```


## Inheritance

By default, all custom errors are `instanceof Error`. To subclass another custom error type, simply pass the desired type as third argument.

```
var CustomErrorBase = errorFactory('CustomErrorBase');
var CustomError = errorFactory('CustomError', ..., CustomErrorBase);

var err = CustomError('Error message');

err instanceof Error;      // => true
err instanceof ErrorBase;  // => true
```


## Contribution

All contributions welcome! Every PR **must** be accompanied by their associated
unit tests!


## License

The MIT License (MIT)

Copyright (c) 2014 Mind2Soft <yanick.rochon@mind2soft.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
