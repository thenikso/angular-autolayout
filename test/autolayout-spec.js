var expect = chai.expect;
chai.should();

describe('Angular Autolayout', function() {

	var autolayout = null;
	var $rootElement = null;

	beforeEach(function() {
		module('autolayout');
		inject(function(_autolayout_, _$rootElement_) {
			autolayout = _autolayout_;
			$rootElement = _$rootElement_;
		});
	});

	it('should define an autolayout service', function() {
		expect(autolayout).to.not.be.undefined;
	});

	it('should accept an element as first parameter', function() {
		var el = angular.element('<div></div>');
		var a = autolayout(el);
		expect(a.containerElement).to.equal(el);
	});

	it('should get the root element if no elements are specified', function() {
		var a = autolayout();
		expect(a.containerElement).to.equal($rootElement);
	});

	it('should not initialize twice if assigned multiple times to the same element', function() {
		var el = angular.element('<div></div>');
		var a = autolayout(el);
		var b = autolayout(el);
		expect(b).to.equal(a);
	});

	describe('when instantiated', function() {

		var containerElement = null;
		var a = null;

		beforeEach(function() {
			containerElement = angular.element('<div></div>');
			a = autolayout(containerElement);
		});

		it('should throw if adding an empty constraint', function() {
			expect(a.addConstraint).to.not.be.undefined;
			expect(a.addConstraint).to.be.a("function");
			expect(a.addConstraint).to.
			throw ();
		});
	});
});