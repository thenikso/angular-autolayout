var expect = chai.expect;
chai.should();

describe('Angular Autolayout', function() {

	var autolayout = null;

	beforeEach(function() {
		module('autolayout');
		inject(function(_autolayout_) {
			autolayout = _autolayout_;
		});
	});

	afterEach(function() {
		autolayout = null;
	});

	it('should define an autolayout service', function() {
		expect(autolayout).to.not.be.undefined;
	});

});