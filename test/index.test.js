
var errorFactory = require('../');

describe('Test custom error', function () {

  it('should create custom errors', function () {
    var CustomError = errorFactory('CustomError');

    CustomError.should.be.a.Function;
    CustomError.name.should.equal('CustomError');
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

});
