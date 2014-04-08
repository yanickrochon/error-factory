# Node Error Factory

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


## Usage


### Simple Usage

```javascript
var CustomException = errorFactory('CustomException');

try {
  throw new CustomException('This is the error message');
} catch (e) {
  console.error(e.message);
}
```


### Custom Error Arguments

Errors may be generated with named arguments. However, the first argument
should *always* be a message string.

```javascript
var CustomException = errorFactory('CustomException', [ 'message', 'context' ]);

try {
  throw new CustomException('This is the error message', { foo: 'bar' });
} catch (e) {
  console.error(e.message, e.context);
}
```


### Namespaced Errors

```javascript
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
