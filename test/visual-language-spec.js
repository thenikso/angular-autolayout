var expect = chai.expect;
chai.should();

describe('Visual Language Constraints', function() {

	var autolayout, al;
	var containerEl, redEl, blueEl, greenEl;

	beforeEach(function() {
		module('autolayout');
		inject(function(_autolayout_) {
			autolayout = _autolayout_;
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
		al = autolayout(containerEl);
	});

	afterEach(function() {
		redEl.remove();
		blueEl.remove();
		greenEl.remove();
		containerEl.remove();
	});

	it('should add a constraint within element', function() {
		redEl.css('width', '10px');
		expect(redEl[0].offsetWidth).to.equal(10);
		al.addConstraint("[redEl(>=30)]");
		expect(redEl[0].offsetWidth).to.equal(30);
	});

	it('should support priorities in element constraints', function() {
		redEl.css('width', '10px');
		expect(redEl[0].offsetWidth).to.equal(10);
		al.addConstraint("[redEl(>=30@10,<=20@30)]");
		expect(redEl[0].offsetWidth).to.equal(20);
	});

	it('should add constraints between two elements internal attributes', function() {
		redEl.css('width', '10px');
		blueEl.css('width', '50px');
		expect(redEl[0].offsetWidth).to.equal(10);
		expect(blueEl[0].offsetWidth).to.equal(50);
		al.addConstraint("[redEl(==blueEl,<=40)]");
		expect(redEl[0].offsetWidth).to.equal(40);
		expect(blueEl[0].offsetWidth).to.equal(40);
	});

});