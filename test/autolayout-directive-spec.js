var expect = chai.expect;
chai.should();

describe('Autolayout Directive', function() {

	var $compile, $rootScope;
	var containerEl, redEl, blueEl, greenEl, scope;

	beforeEach(function() {
		module('autolayout');
		inject(function(_$compile_, _$rootScope_) {
			$compile = _$compile_;
			$rootScope = _$rootScope_;
			scope = $rootScope.$new(true);
		});
		containerEl = angular.element('<div id="containerEl" style="background:gray;"></div>').css({
			width: '100px',
			height: '100px'
		});
		redEl = angular.element('<div id="redEl" style="background:red;"></div>');
		blueEl = angular.element('<div id="blueEl" style="background:blue;"></div>');
		greenEl = angular.element('<div id="greenEl" style="background:green;"></div>');
		containerEl.append(redEl).append(blueEl).append(greenEl);
		angular.element(document.body).append(containerEl);
	});

	afterEach(function() {
		redEl.remove();
		blueEl.remove();
		greenEl.remove();
		containerEl.remove();
	});

	it('should remove the constraint DOM element', function() {
		var cEl = angular.element('<al-constraint visual-format="|[redEl][blueEl]|"/>');
		containerEl.append(cEl);
		$compile(containerEl)(scope);
		expect(cEl.parent()[0]).to.be.undefined;
	});

	it('should add a constraint with visual language', function() {
		containerEl.append('<al-constraint visual-format="|[redEl(==blueEl)][blueEl]|"/>');
		$compile(containerEl)(scope);
		expect(redEl[0].offsetWidth).to.equal(50);
		expect(blueEl[0].offsetWidth).to.equal(50);
	});

	it('should add a constraint with parameters', function() {
		containerEl.append('<al-constraint element="redEl" attribute="width" relation="greaterOrEqual" to-element="containerEl" to-attribute="width" multiplier="0.5" constant="5"/>');
		$compile(containerEl)(scope);
		expect(redEl[0].offsetWidth).to.equal(55);
	});

	it('should add multiple constraints', function() {
		containerEl.append('<al-constraint>V:|-5-[redEl]-5-|</al-constraint>');
		containerEl.append('<al-constraint visual-format="|[redEl(==blueEl)][blueEl]|"/>');
		containerEl.append('<al-constraint visual-format="V:|[blueEl]-5-|"/>');
		$compile(containerEl)(scope);
		expect(redEl[0].offsetWidth).to.equal(50);
		expect(redEl[0].offsetTop).to.equal(5);
		expect(redEl[0].offsetHeight).to.equal(90);
		expect(blueEl[0].offsetWidth).to.equal(50);
		expect(blueEl[0].offsetTop).to.equal(0);
		expect(blueEl[0].offsetHeight).to.equal(95);
	});

	it('should remove a constraint when the element is removed', function() {
		scope.testCond = 1;
		containerEl.append('<al-constraint ng-if="testCond == 1" visual-format="[redEl(==50)]"/>');
		containerEl.append('<al-constraint ng-if="testCond == 2" visual-format="[redEl(==30)]"/>');
		$compile(containerEl)(scope);
		scope.$digest();
		expect(redEl[0].offsetWidth).to.equal(50);
		scope.testCond = 2;
		scope.$digest();
		expect(redEl[0].offsetWidth).to.equal(30);
	});

});