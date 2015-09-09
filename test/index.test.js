

describe('Test custom error', function () {

  var errorFactory = require('../');


  it('should create custom errors', function () {
    var util = require('util');

    var CustomError = errorFactory('CustomError');
    var err = new CustomError('test');

    CustomError.should.be.a.Function;
    CustomError.name.should.equal('CustomError');

    err.should.be.instanceof(CustomError);
    err.should.be.instanceof(Error);

    util.isError(err).should.be.true;
    Error.prototype.isPrototypeOf(err).should.be.true;
  });

  it('should fail in invalid name', function () {
    [
      undefined, null, false, true,
      0, 1,
      '', ' name', '-', '!', 'while',
      {}, [],
      function () {}
    ].forEach(function (invalidName) {
      +function () {
        errorFactory(invalidName);
      }.should.throw();
    });
  });

  it('should not redefine original Error', function () {
    var OldError = Error;
    var Error2 = errorFactory('Error');

    OldError.should.equal(Error);
    Error.should.not.equal(Error2);
    OldError.should.not.equal(Error2);
  });

  it('should have valid stack', function () {
    var ErrorWithStack = errorFactory('ErrorWithStack');

    var err = new ErrorWithStack();

    err.should.be.an.Error;
    err.stack.should.be.an.String.and.not.be.empty;
  });

  it('should provide default message argument', function () {
    var ErrorWithMessage = errorFactory('ErrorWithMessage');

    var err = new ErrorWithMessage('Hello test error!');

    err.should.be.an.Error;
    err.message.should.be.a.String.and.equal('Hello test error!');
    err._message.should.be.a.String.and.equal('Hello test error!');
  });

  it('should provide custom arguments', function () {
    var ErrorWithArguments = errorFactory('ErrorWithArgs', ['message', 'context', 'test']);
    var testObj = { test: true };

    var err = new ErrorWithArguments('Test message', 'Some context', testObj);

    err.should.be.an.Error;
    err.should.have.property('message').and.be.a.String.and.equal('Test message');
    err.should.have.property('context').and.be.a.String.and.equal('Some context');
    err.should.have.property('test').and.be.an.Object.and.equal(testObj);
  });

  it('should provide custom default argument values', function () {
    var ErrorWithArguments = errorFactory('ErrorWithArgsDefault', {
      'str': undefined,
      'obj': {},
      'bool': false,
      'nil': null,
      'num': 123,
      'str2': 'foo'
    });

    var err = new ErrorWithArguments();
    err.should.be.an.Error;
    assert.equal(err.str, undefined);
    err.obj.should.be.an.Object.and.eql({});
    assert.equal(err.bool, false);
    assert.equal(err.nil, null);
    assert.equal(err.num, 123);
    err.str2.should.be.a.String.and.equal('foo');

    err = ErrorWithArguments('Foo', null, true, false, 0, undefined);
    err.should.be.an.Error;
    err.str.should.be.a.String.and.equal('Foo')
    assert.equal(err.obj, null);
    err.bool.should.be.true;
    err.nil.should.be.false;
    err.num.should.be.a.Number.and.equal(0);
    err.str2.should.be.a.String.and.equal('foo');
  });

  it('should return namespaced errors', function () {
    var ArgumentException = errorFactory('ArgumentException');
    var MyArgumentException = errorFactory('my.ArgumentException');

    ArgumentException.name.should.equal('ArgumentException');
    MyArgumentException.name.should.equal('ArgumentException');

    ArgumentException.canonicalName.should.equal('ArgumentException');
    MyArgumentException.canonicalName.should.equal('my.ArgumentException');

    ArgumentException.name.should.equal(MyArgumentException.name);
    ArgumentException.should.not.equal(MyArgumentException);
  });

  it('should validate cache', function () {
    var TestError = errorFactory('TestError');
    var TestError1 = errorFactory('TestError');
    var TestError2 = errorFactory('namespace.TestError');

    TestError.should.equal(TestError1);
    TestError1.should.equal(TestError);
    TestError.should.not.equal(TestError2);
    TestError1.should.not.equal(TestError2);

    TestError.should.equal(errorFactory('TestError'));
    TestError2.should.equal(errorFactory('namespace.TestError'));
  });

  it('should allow throw without new', function () {
    var TestError = errorFactory('TestError');

    TestError('Test').should.be.an.Error;
    TestError('Test').message.should.equal('Test');
  });

  it('should parse message template (w/o stack)', function () {
    var TestError = errorFactory('TestTemplateError', [ 'message', 'messageData' ]);

    var e = new TestError('Foo {{bar}}', { bar: 'Hello' });

    e.message.should.equal('Foo Hello');
    e._message.should.equal('Foo {{bar}}');

    e.stack.indexOf('TestTemplateError: Foo Hello').should.equal(0);

    e.message = 'Bar {{bar}}';

    e.message.should.equal('Bar Hello');
    e._message.should.equal('Bar {{bar}}');

    e.stack.indexOf('TestTemplateError: Foo Hello').should.equal(0);
  });

  it('should parse message template (w/ stack)', function () {
    var TestError = errorFactory('TestTemplateError', [ 'message', 'messageData' ]);
    var e = new TestError('Foo {{bar}}', { bar: 'Hello' });

    errorFactory.autoUpdateStack.should.be.false;
    errorFactory.autoUpdateStack = true;
    errorFactory.autoUpdateStack.should.be.true;

    e.message.should.equal('Foo Hello');
    e._message.should.equal('Foo {{bar}}');

    e.stack.indexOf('TestTemplateError: Foo Hello').should.equal(0);

    e.message = 'Bar {{bar}}';

    e.message.should.equal('Bar Hello');
    e._message.should.equal('Bar {{bar}}');

    e.stack.indexOf('TestTemplateError: Bar Hello').should.equal(0);
  });

  it('should ignore missing message template tokens', function () {
    var TestError = errorFactory('TestTemplateMissingTokenError', [ 'message', 'messageData' ]);
    var e = new TestError('Foo {{bar}}', { foo: 'Hello' });

    e.message.should.equal('Foo {{bar}}');
    e._message.should.equal('Foo {{bar}}');
  });

  it('should fallback to error class name on empty message', function () {
    var TestError = errorFactory('TestTemplateMissingMessageError');
    var e = new TestError('Hello world!');

    e.message.should.equal('Hello world!');
    e._message = false;
    e.message.should.equal('TestTemplateMissingMessageError');
  });

  it('should not allow invalid named arguments', function () {
    // NOTE : "var a = { undefined: undefined };" is valid!
    [
      [ 'while (true);' ],
      [ 123 ],
      { foo: undefined, '123': true },
      { bar: null, 'console.log(false)': true },
      { 'false': true },
      { 'if(true)process.exit()': true },
      { '_message': 'Hello!' },
      { 'stack': [] }
    ].forEach(function (options, index) {
      +function () { errorFactory('TestInvalidNamedArgs' + index, options); }.should.throw();
    });
  });

  it('should have a clean stack trace', function () {
    var TestError = errorFactory('TestCleanStackTrace');
    var err = TestError();

    err.stack.indexOf('eval').should.be.equal(-1);
  });


  describe('Test ErrorProperty', function () {

    it('should fail with invalid property description', function () {
      [
        void 0, null,
        undefined, true, false,
        -1, 0, 1,
        '', 'abc',
        [], /./,
        function () {}
      ].forEach(function (description) {
        +function () { errorFactory.ErrorProperty(description); }.should.throw();
      });
    });

    it('should create a property without argument', function () {
      var TestError = errorFactory('TestErrorPropertyNoArgument', {
        'propExplicit': errorFactory.ErrorProperty({
          value: 'explicit'
        }, false),
        'propImplicit': errorFactory.ErrorProperty({
          value: 'implicit'
        })
      });

      var err = TestError();

      TestError.length.should.equal(1);
      TestError.toString().should.startWith('function TestErrorPropertyNoArgument(message)');
      err.propExplicit.should.equal('explicit');
      err.propImplicit.should.equal('implicit');
    });

    it('should create a readonly property with argument', function () {
      var TestError = errorFactory('TestErrorPropertyWithArgument', {
        'propArg': errorFactory.ErrorProperty({
          writable: false,
          value: 'arg'
        }, true),
        'propNoArg': errorFactory.ErrorProperty({
          value: 'no arg'
        })
      });

      var err = TestError();

      TestError.length.should.equal(1);
      err.propArg.should.equal('arg');
      err.propNoArg.should.equal('no arg');

      +function () { 'use strict'; err.propArg = 'will throw!'; }.should.throw();
      err.propArg.should.equal('arg');

      // specify arg
      err = TestError('test');

      err.propArg.should.equal('test');
      err.propNoArg.should.equal('no arg');

      +function () { 'use strict'; err.propArg = 'will throw!'; }.should.throw();
      err.propArg.should.equal('test');

    });

    it('should create a readonly error message', function () {
      var TestError = errorFactory('TestErrorPropertyReadonlyMessage', {
        message: errorFactory.ErrorProperty({
          writable: false
        })
      });

      var err = TestError('Test message');

      err.message.should.equal('Test message');
      +function () { 'use strict'; err.message = 'will throw!'; }.should.throw();
      err.message.should.equal('Test message');
    });

  });


  describe('Extending Error types', function () {

    it('should be valid with other error types', function () {
      var util = require('util');
      var TestError = errorFactory('TestExtendBase', {
        'a': 'a',
        't': 't',
        'c': 'c',
        'x': 'x',
        'y': 'y',
        'z': 'z'
      });
      var TestErrorExt = errorFactory('TestExtendExtended', ['z', 'b', 'c', 'd'], TestError);

      var err = TestErrorExt(1, 2, 3, 4, 5, 6);

      err.should.be.instanceof(TestError);
      err.should.be.instanceof(TestErrorExt);

      util.isError(err).should.be.true;
      Error.prototype.isPrototypeOf(err).should.be.true;

      err.should.have.property('a').and.be.equal('a');
      err.should.have.property('b').and.be.equal(2);
      err.should.have.property('c').and.be.equal(3);
      err.should.have.property('d').and.be.equal(4);
      err.should.have.property('t').and.be.equal('t');
      err.should.have.property('x').and.be.equal('x');
      err.should.have.property('y').and.be.equal('y');
      err.should.have.property('z').and.be.equal(1);
    });

    it('should be invalid with invalid error type', function () {
      [
        false, true, 0,
        function () {}, function Error() {}, {}, [], /./,
        '', 'Error'
      ].forEach(function (invalidType, index) {
        (function () {
          errorFactory('TestExtendExtendedInvalid' + index, [], invalidType);
        }).should.throw();
      });
    });

  });

});
