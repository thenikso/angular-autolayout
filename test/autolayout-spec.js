var expect = chai.expect;
chai.should();

describe('Angular Autolayout', function() {

	var autolayout = null;
	var $rootScope = null;
	var $rootElement = null;
	var $compile = null;

	beforeEach(function() {
		module('autolayout');
		inject(function(_autolayout_, _$rootScope_, _$rootElement_, _$compile_) {
			autolayout = _autolayout_;
			$rootScope = _$rootScope_;
			$rootElement = _$rootElement_;
			$compile = _$compile_;
		});
	});

	afterEach(function() {
		autolayout = null;
	});

	it('should define an autolayout service', function() {
		expect(autolayout).to.not.be.undefined;
	});

	it('should accept an element as first parameter', function() {
		var el = angular.element('<div></div>');
		var scope = $rootScope.$new(true);
		$compile(el)(scope);
		var a = autolayout(el);
		expect(a.containerElement).to.equal(el);
		expect(a.scope).to.equal(scope);
	});

	it('should get the root element if no elements are specified', function() {
		var a = autolayout();
		expect(a.containerElement).to.equal($rootElement);
		expect(a.scope).to.equal($rootScope);
	});

	describe('when defined on an element', function() {

		var containerElement = null;
		var containerElementScope = null;
		var a = null;

		beforeEach(function() {
			containerElement = angular.element('<div></div>');
			containerElementScope = $rootScope.$new(true);
			$compile(containerElement)(containerElementScope);
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