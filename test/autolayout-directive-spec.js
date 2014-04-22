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
		var cEl = angular.element('<al-constraint visual-format="|[redEl][blueEl]|"></al-constraint>');
		containerEl.append(cEl);
		$compile(containerEl)(scope);
		expect(cEl.parent()[0]).to.be.undefined;
	});

	it('should add a constraint with visual language', function() {
		containerEl.append('<al-constraint visual-format="|[redEl(==blueEl)][blueEl]|"></al-constraint>');
		$compile(containerEl)(scope);
		expect(redEl[0].offsetWidth).to.equal(50);
		expect(blueEl[0].offsetWidth).to.equal(50);
	});

	it('should add a constraint with parameters', function() {
		containerEl.append('<al-constraint element="redEl" attribute="width" relation="greaterOrEqual" to-element="containerEl" to-attribute="width" multiplier="0.5" constant="5"></al-constraint>');
		$compile(containerEl)(scope);
		expect(redEl[0].offsetWidth).to.equal(55);
	});

	it('should add multiple constraints', function() {
		containerEl.append('<al-constraint>V:|-5-[redEl]-5-|</al-constraint>');
		containerEl.append('<al-constraint visual-format="|[redEl(==blueEl)][blueEl]|"></al-constraint>');
		containerEl.append('<al-constraint visual-format="V:|[blueEl]-5-|"></al-constraint>');
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
		containerEl.append('<al-constraint ng-if="testCond == 1" visual-format="[redEl(==50)]"></al-constraint>');
		containerEl.append('<al-constraint ng-if="testCond == 2" visual-format="[redEl(==30)]"></al-constraint>');
		$compile(containerEl)(scope);
		scope.$digest();
		expect(redEl[0].offsetWidth).to.equal(50);
		scope.testCond = 2;
		scope.$digest();
		expect(redEl[0].offsetWidth).to.equal(30);
	});

	it('should accept an align attribute for visual language type', function() {
		containerEl.append('<al-constraint align="top">|-[redEl(==blueEl)]-[blueEl(==greenEl)]-[greenEl]-|</al-constraint>');
		containerEl.append('<al-constraint>V:|-5-[redEl(==blueEl,==greenEl)]-|</al-constraint>');
		$compile(containerEl)(scope);
		expect(redEl[0].offsetTop).to.equal(5);
		expect(blueEl[0].offsetTop).to.equal(5);
		expect(greenEl[0].offsetTop).to.equal(5);
	});

	it('should support center allignment', function() {
		containerEl.append('<al-constraint>[redEl(==40)]</al-constraint>');
		containerEl.append('<al-constraint>V:[redEl(==30)]</al-constraint>');
		containerEl.append('<al-constraint element="redEl" attribute="centerX" relation="equal" to-attribute="centerX"></al-constraint>');
		containerEl.append('<al-constraint element="redEl" attribute="centerY" relation="equal" to-attribute="centerY"></al-constraint>');
		$compile(containerEl)(scope);
		expect(redEl[0].offsetLeft).to.equal((100 - 40) / 2);
		expect(redEl[0].offsetTop).to.equal((100 - 30) / 2);
	});

	it('should update the constraint when the attributes change', function() {
		scope.testWidth = 40;
		scope.testHeight = 20;
		scope.testLeft = 5;
		scope.testAlign = "top";
		containerEl.append('<al-constraint align="{{testAlign}}">[redEl(=={{testWidth}})][blueEl]</al-constraint>');
		containerEl.append('<al-constraint visual-format="V:[redEl(=={{testHeight}})]"></al-constraint>');
		containerEl.append('<al-constraint element="redEl" attribute="left" relation="equal" to-attribute="left" constant="{{testLeft}}"></al-constraint>');
		$compile(containerEl)(scope);
		scope.$digest();
		expect(redEl[0].offsetLeft).to.equal(scope.testLeft);
		expect(redEl[0].offsetWidth).to.equal(scope.testWidth);
		expect(redEl[0].offsetHeight).to.equal(scope.testHeight);
		expect(blueEl[0].offsetTop).to.equal(redEl[0].offsetTop);
		scope.testWidth = 32;
		scope.testHeight = 30;
		scope.testLeft = 7;
		scope.testAlign = "bottom";
		scope.$digest();
		expect(redEl[0].offsetLeft).to.equal(scope.testLeft);
		expect(redEl[0].offsetWidth).to.equal(scope.testWidth);
		expect(redEl[0].offsetHeight).to.equal(scope.testHeight);
		expect(blueEl[0].offsetTop).to.equal(redEl[0].offsetTop + redEl[0].offsetHeight - blueEl[0].offsetTop);
	});

	it('should support `al-update-on` directive on container element', function() {
		var testEventName = 'testEvent';
		containerEl.append('<al-constraint>|-10-[redEl]-10-|</al-constraint>');
		containerEl.attr('al-update-on', testEventName);
		$compile(containerEl)(scope);
		expect(redEl[0].offsetWidth).to.equal(80);
		containerEl.css('width', '50px')
		scope.$broadcast(testEventName);
		expect(redEl[0].offsetWidth).to.equal(30);
	});

});