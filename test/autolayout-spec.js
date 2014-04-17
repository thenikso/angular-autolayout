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
		var al = null;

		beforeEach(function() {
			containerElement = angular.element('<div></div>');
			angular.element(document.body).append(containerElement);
			al = autolayout(containerElement);
		});

		it('should throw if adding an empty constraint', function() {
			expect(al.addConstraint).to.not.be.undefined;
			expect(al.addConstraint).to.be.a("function");
			expect(al.addConstraint).to.
			throw ();
		});

		describe('programmatic API', function() {

			var elA = null;
			var elB = null;

			beforeEach(function() {
				containerElement.css({
					width: '100px',
					height: '100px',
					position: 'relative'
				});
				elA = angular.element('<div id="a" style="width:10px;height:10px"></div>');
				elA.css({
					width: '10px',
					height: '10px',
				});
				elB = angular.element('<div id="b" style="width:10px;height:10px"></div>');
				elB.css({
					width: '10px',
					height: '10px',
				});
				containerElement.append(elA).append(elB);
			});

			it('should throw if adding a constraint with insufficient options', function() {
				expect(function() {
					al.addConstraint({})
				}).to.
				throw ();
				expect(function() {
					al.addConstraint({
						fromAttribute: 'left',
						toAttribute: 'right'
					})
				}).to.
				throw ();
				expect(function() {
					al.addConstraint({
						fromElement: elA,
						fromAttribute: 'left',
						toAttribute: 'right'
					})
				}).to.
				throw ();
			});

			it('should throw if adding a constraint with invalid options', function() {
				expect(function() {
					al.addConstraint({
						fromElement: elA,
						fromAttribute: 'INVALID',
						toAttribute: 'right',
						relatedBy: 'equal'
					})
				}).to.
				throw ();
				expect(function() {
					al.addConstraint({
						fromElement: elA,
						fromAttribute: 'left',
						toAttribute: 'INVALID',
						relatedBy: 'equal'
					})
				}).to.
				throw ();
				expect(function() {
					al.addConstraint({
						fromElement: elA,
						fromAttribute: 'left',
						toAttribute: 'right',
						relatedBy: 'INVALID'
					})
				}).to.
				throw ();
			});

			it('should build a proper constraint', function() {
				var c = null;
				var faSpy = sinon.spy();
				expect(function() {
					c = al.addConstraint({
						fromElement: elA,
						fromAttribute: faSpy,
						toAttribute: 'right',
						relatedBy: 'equal'
					})
				}).not.to.
				throw ();
				expect(c).to.not.be.undefined;
				expect(c.fromElement).to.equal(elA);
				expect(c.toElement).to.equal(containerElement);
				expect(faSpy.called).to.be.true;
			});

			it('should not apply constriants if element is not in the document', function() {
				containerElement.remove();
				expect(elA.css('left')).to.equal('');
				expect(elB.css('left')).to.equal('');
				al.addConstraint({
					fromElement: elA,
					fromAttribute: 'right',
					toElement: elB,
					toAttribute: 'left',
					relatedBy: 'equal',
					constant: 20
				});
				expect(elA.css('left')).to.equal('');
				expect(elB.css('left')).to.equal('');
			});

		});
	});
});