var expect = chai.expect;
chai.should();

describe('Angular Autolayout Provider', function() {

	var autolayoutProvider = null;

	beforeEach(function() {
		angular.module('testModule', ['autolayout'])
			.config(function(_autolayoutProvider_) {
				autolayoutProvider = _autolayoutProvider_;
			});
		module('testModule');
		inject(function() {});
	});

	afterEach(function() {
		autolayoutProvider = null;
	});

	it('should define an autolayoutProvider', function() {
		expect(autolayoutProvider).to.not.be.undefined;
	});

});