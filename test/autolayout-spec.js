var expect = chai.expect;
chai.should();

describe('Angular Autolayout', function() {

	var autolayout = null;
	var $rootElement = null;
	var cassowary = null;

	beforeEach(function() {
		module('autolayout');
		inject(function(_autolayout_, _$rootElement_, _cassowary_) {
			autolayout = _autolayout_;
			$rootElement = _$rootElement_;
			cassowary = _cassowary_;
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

		afterEach(function() {
			containerElement.remove();
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
				elA = angular.element('<div id="elA" style="background:red;width:10px;height:10px"></div>');
				elA.css({
					width: '10px',
					height: '10px',
				});
				elB = angular.element('<div id="elB" style="background:blue;width:10px;height:10px"></div>');
				elB.css({
					width: '10px',
					height: '10px',
				});
				containerElement.append(elA).append(elB);
			});

			afterEach(function() {
				elA.remove();
				elB.remove();
			});

			it('should throw if adding a constraint with insufficient options', function() {
				expect(function() {
					al.addConstraint({})
				}).to.
				throw ();
				expect(function() {
					al.addConstraint({
						attribute: 'left',
						toAttribute: 'right'
					})
				}).to.
				throw ();
				expect(function() {
					al.addConstraint({
						element: elA,
						attribute: 'left',
						toAttribute: 'right'
					})
				}).to.
				throw ();
			});

			it('should throw if adding a constraint with invalid options', function() {
				expect(function() {
					al.addConstraint({
						element: elA,
						attribute: 'INVALID',
						toAttribute: 'right',
						relation: 'equal'
					})
				}).to.
				throw ();
				expect(function() {
					al.addConstraint({
						element: elA,
						attribute: 'left',
						toAttribute: 'INVALID',
						relation: 'equal'
					})
				}).to.
				throw ();
				expect(function() {
					al.addConstraint({
						element: elA,
						attribute: 'left',
						toAttribute: 'right',
						relation: 'INVALID'
					})
				}).to.
				throw ();
			});

			it('should build a proper constraint', function() {
				var c = null;
				var faSpy = sinon.stub().returns(function() {});
				var rbSpy = sinon.stub().returns(new cassowary.Equation(0, 0));
				expect(function() {
					c = al.addConstraint({
						element: elA,
						attribute: faSpy,
						toAttribute: 'right',
						relation: rbSpy
					})
				}).not.to.
				throw ();
				expect(c).to.not.be.undefined;
				c = c[0];
				expect(c.element).to.equal(elA);
				expect(c.toElement).to.equal(containerElement);
				expect(faSpy.called).to.be.true;
				expect(rbSpy.called).to.be.true;
			});

			it('should throw if applying constraints to non-direct child elements', function() {
				var elNested = angular.element('<div></div>');
				elA.append(elNested);
				expect(function() {
					al.addConstraint({
						element: elA,
						attribute: 'right',
						toElement: elNested,
						toAttribute: 'left',
						relation: 'equal',
						constant: 20
					});
				}).to.
				throw ();
			});

			it('should not apply constriants if element is not in the document', function() {
				containerElement.remove();
				expect(elA.css('left')).to.equal('');
				expect(elB.css('left')).to.equal('');
				al.addConstraint({
					element: elA,
					attribute: 'right',
					toElement: elB,
					toAttribute: 'left',
					relation: 'equal',
					constant: 20
				});
				expect(elA.css('left')).to.equal('');
				expect(elB.css('left')).to.equal('');
			});

			it('should throw if applying conflicting constraints', function() {
				al.addConstraint({
					element: elA,
					attribute: 'width',
					relation: 'equal',
					constant: 50
				});
				expect(function() {
					al.addConstraint({
						element: elA,
						attribute: 'width',
						relation: 'equal',
						constant: 30
					});
				}).to.
				throw ();
			});

			it('should materialize a constraint of an element attribute', function() {
				expect(elA[0].offsetWidth).to.equal(10);
				al.addConstraint({
					element: elA,
					attribute: 'width',
					relation: 'greaterOrEqual',
					multiplier: 2,
					constant: 20
				});
				expect(elA[0].offsetWidth).to.equal(20);
			});

			it('should materialize a constraint between two elements', function() {
				expect(elA[0].offsetLeft).to.equal(0);
				expect(elA[0].offsetWidth).to.equal(10);
				expect(elB[0].offsetLeft).to.equal(0);
				expect(elB[0].offsetWidth).to.equal(10);
				expect(elA.css('left')).to.equal('');
				expect(elB.css('left')).to.equal('');
				al.addConstraint({
					element: elA,
					attribute: 'right',
					toElement: elB,
					toAttribute: 'left',
					relation: 'equal',
					constant: -20
				});
				expect(elA[0].offsetLeft).to.equal(0);
				expect(elA[0].offsetWidth).to.equal(10);
				expect(elB[0].offsetLeft).to.equal(30);
				expect(elB[0].offsetWidth).to.equal(10);
				expect(elA.css('left')).to.equal('0px');
				expect(elB.css('left')).to.equal('30px');
				expect(elA.data('$autolayoutExpressions')).to.not.be.undefined;
				expect(elB.data('$autolayoutExpressions')).to.not.be.undefined;
				expect(containerElement.data('$autolayoutExpressions')).to.be.undefined;
			});

			it('should materialize a constraint between an element and it\'s container', function() {
				containerElement.css({
					position: 'absolute',
					top: '15px',
					left: '15px'
				});
				expect(containerElement[0].offsetLeft).to.equal(15);
				expect(containerElement[0].offsetWidth).to.equal(100);
				expect(elA[0].offsetLeft).to.equal(0);
				expect(elA[0].offsetWidth).to.equal(10);
				expect(elA.css('left')).to.equal('');
				al.addConstraint({
					element: null,
					attribute: 'right',
					toElement: elA,
					toAttribute: 'right',
					relation: 'equal',
					constant: 0
				});
				expect(containerElement[0].offsetLeft).to.equal(15);
				expect(containerElement[0].offsetWidth).to.equal(100);
				expect(elA[0].offsetLeft).to.equal(90);
				expect(elA[0].offsetWidth).to.equal(10);
				expect(elA.css('left')).to.equal('90px');
				expect(elA.data('$autolayoutExpressions')).to.not.be.undefined;
				expect(containerElement.data('$autolayoutContainerExpressions')).to.not.be.undefined;
				expect(containerElement.data('$autolayoutExpressions')).to.be.undefined;
			});

			it('should materialize multiple constraints', function() {
				containerElement.css({
					position: 'absolute',
					top: '15px',
					left: '15px'
				});
				expect(containerElement[0].offsetLeft).to.equal(15);
				expect(containerElement[0].offsetWidth).to.equal(100);
				expect(elA[0].offsetLeft).to.equal(0);
				expect(elA[0].offsetWidth).to.equal(10);
				al.addConstraint({
					element: null,
					attribute: 'left',
					toElement: elA,
					toAttribute: 'left',
					relation: 'equal',
					constant: -10
				});
				al.addConstraint({
					element: elA,
					attribute: 'width',
					toElement: null,
					toAttribute: 'width',
					relation: 'equal',
					constant: -20
				});
				expect(containerElement[0].offsetLeft).to.equal(15);
				expect(containerElement[0].offsetWidth).to.equal(100);
				expect(elA[0].offsetLeft).to.equal(10);
				expect(elA[0].offsetWidth).to.equal(80);
			});

			it('should update constraints when container changes', function() {
				containerElement.css({
					position: 'absolute',
					top: '15px',
					left: '15px'
				});
				expect(containerElement[0].offsetLeft).to.equal(15);
				expect(containerElement[0].offsetWidth).to.equal(100);
				expect(elA[0].offsetLeft).to.equal(0);
				expect(elA[0].offsetWidth).to.equal(10);
				al.addConstraint({
					element: null,
					attribute: 'left',
					toElement: elA,
					toAttribute: 'left',
					relation: 'equal',
					constant: -10
				});
				al.addConstraint({
					element: elA,
					attribute: 'width',
					toElement: null,
					toAttribute: 'width',
					relation: 'equal',
					constant: -20
				});
				containerElement.css({
					width: '200px',
					height: '200px'
				});
				al.update();
				expect(containerElement[0].offsetLeft).to.equal(15);
				expect(containerElement[0].offsetWidth).to.equal(200);
				expect(elA[0].offsetLeft).to.equal(10);
				expect(elA[0].offsetWidth).to.equal(180);
				containerElement.css({
					width: '400px',
					height: '400px'
				});
				al.update();
				expect(containerElement[0].offsetLeft).to.equal(15);
				expect(containerElement[0].offsetWidth).to.equal(400);
				expect(elA[0].offsetLeft).to.equal(10);
				expect(elA[0].offsetWidth).to.equal(380);
			});

			it('should update constraints of child autolayouts', function() {
				nestedAl = autolayout(elA);
				elB.remove();
				elA.append(elB);
				expect(containerElement[0].offsetWidth).to.equal(100);
				expect(elA[0].offsetWidth).to.equal(10);
				expect(elB[0].offsetWidth).to.equal(10);
				al.addConstraint({
					element: elA,
					attribute: 'width',
					toElement: null,
					toAttribute: 'width',
					relation: 'equal',
					constant: -20
				});
				expect(elA[0].offsetWidth).to.equal(80);
				expect(elB[0].offsetWidth).to.equal(10);
				nestedAl.addConstraint({
					element: elB,
					attribute: 'width',
					toElement: null,
					toAttribute: 'width',
					relation: 'equal',
					constant: -20
				});
				expect(elA[0].offsetWidth).to.equal(80);
				expect(elB[0].offsetWidth).to.equal(60);
				containerElement.css({
					width: '200px'
				});
				al.update();
				expect(containerElement[0].offsetWidth).to.equal(200);
				expect(elA[0].offsetWidth).to.equal(180);
				expect(elB[0].offsetWidth).to.equal(160);
			});

			it('should add a constraint between elements with visual language', function() {
				expect(containerElement[0].offsetWidth).to.equal(100);
				expect(elA[0].offsetLeft).to.equal(0);
				expect(elA[0].offsetWidth).to.equal(10);
				al.addConstraint("|-5-[elA]-10-|");
				expect(elA[0].offsetLeft).to.equal(5);
				expect(elA[0].offsetWidth).to.equal(100 - 5 - 10);
			});

			it('should remove a constriant', function() {
				expect(elA[0].offsetLeft).to.equal(0);
				var c = al.addConstraint("|-(==40)-[elA]");
				expect(elA[0].offsetLeft).to.equal(40);
				elA.css('left', '0px');
				expect(elA[0].offsetLeft).to.equal(0);
				al.materialize();
				expect(elA[0].offsetLeft).to.equal(40);
				al.removeConstraint(c);
				elA.css('left', '5px');
				expect(elA[0].offsetLeft).to.equal(5);
				al.materialize();
				expect(elA[0].offsetLeft).to.equal(5);
			});

			it('should cleanup when destroyed', function() {
				al.addConstraint({
					element: null,
					attribute: 'right',
					toElement: elA,
					toAttribute: 'right',
					relation: 'equal',
					constant: 0
				});
				expect(elA.data('$autolayoutExpressions')).to.not.be.undefined;
				expect(containerElement.data('$autolayoutContainerExpressions')).to.not.be.undefined;
				expect(containerElement.data('$autolayoutExpressions')).to.be.undefined;
				al.destroy();
				expect(elA.data('$autolayoutExpressions')).to.be.null;
				expect(containerElement.data('$autolayoutContainerExpressions')).to.be.null;
				expect(containerElement.data('$autolayoutExpressions')).to.be.undefined;
			});

		});
	});
});