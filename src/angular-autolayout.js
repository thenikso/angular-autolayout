(function(context) {

	// Get cassowary constraint solver
	var c = context.c

	// Define exported module
	angular.module('autolayout', ['ng']);

	// Main `autolayout` service
	angular.module('autolayout').provider('autolayout', function() {

		this.$get = ['$rootElement', '$rootScope',
			function($rootElement, $rootScope) {
				return null;
			}
		];

	});

})(this);