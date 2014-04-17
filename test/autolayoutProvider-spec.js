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

	it('should define default relations', function() {
		expect(autolayoutProvider.relations).to.not.be.undefined;
		expect(autolayoutProvider.relations.equal).to.be.a("function");
		expect(autolayoutProvider.relations.greaterOrEqual).to.be.a("function");
		expect(autolayoutProvider.relations.lessOrEqual).to.be.a("function");
	});

	it('should define default attribute converters', function() {
		expect(autolayoutProvider.attributeConverters).to.not.be.undefined;
		expect(autolayoutProvider.attributeConverters.left).to.not.be.undefined;
		expect(autolayoutProvider.attributeConverters.top).to.not.be.undefined;
		expect(autolayoutProvider.attributeConverters.width).to.not.be.undefined;
		expect(autolayoutProvider.attributeConverters.height).to.not.be.undefined;
		expect(autolayoutProvider.attributeConverters.right).to.not.be.undefined;
		expect(autolayoutProvider.attributeConverters.bottom).to.not.be.undefined;
	});

	it('provides a `cassowary` constant', function() {
		var c = undefined;
		expect(function() {
			inject(function(cassowary) {
				c = cassowary;
			})
		}).to.not.
		throw ();
		expect(c).to.equal(window.c);
	});

});