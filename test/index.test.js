
var errorFactory = require('../');

describe('Test custom error', function () {

  it('should create custom errors', function () {
    var CustomError = errorFactory('CustomError');

    CustomError.should.be.a.Function;
    CustomError.name.should.equal('CustomError');
  });

  it('should fail in invalid name', function () {
    [
      undefined, null, false, true,
      0, 1,
      '', ' name', '-', '!',
      {}, [],
      function () {}
    ].forEach(function (invalidName) {
      (function () {
        errorFactory(invalidName);
      }).should.throw();
    });
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

    ArgumentException.fullName.should.equal('ArgumentException');
    MyArgumentException.fullName.should.equal('my.ArgumentException');

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

});
