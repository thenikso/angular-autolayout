(function(context) {

	// Get cassowary constraint solver
	var c = context.c

	// Define exported module
	angular.module('autolayout', ['ng']);

	// Main `autolayout` service
	angular.module('autolayout').provider('autolayout', function() {

		function Autolayout(container) {
			if (!(this instanceof Autolayout)) {
				return new Autolayout(container);
			}
			this.containerElement = angular.element(container || Autolayout.$rootElement);
			this.scope = this.containerElement.scope() || Autolayout.$rootScope;
		}

		Autolayout.prototype.addConstraint = function(constraint) {
			if (!constraint) {
				throw new Error("A constraint parameter should be defined.");
			}
		};

		this.$get = ['$rootElement', '$rootScope',
			function($rootElement, $rootScope) {
				Autolayout.$rootElement = $rootElement;
				Autolayout.$rootScope = $rootScope;
				return Autolayout;
			}
		];

	});

})(this);