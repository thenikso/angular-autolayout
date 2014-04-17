(function(context) {

	// Get cassowary constraint solver
	var c = context.c

	// Define exported module
	angular.module('autolayout', ['ng']);

	// Main `autolayout` service
	angular.module('autolayout').provider('autolayout', function() {

		var provider = this;

		provider.relations = {
			equal: function(a, b, priority) {
				return new c.Equation(a, b, c.Strength.medium, priority || 0)
			},
			greaterOrEqual: function(a, b, priority) {
				return new c.Inequality(a, c.GEQ, b, c.Strength.medium, priority || 0);
			},
			lessOrEqual: function(a, b, priority) {
				return new c.Inequality(a, c.LEQ, b, c.Strength.medium, priority || 0);
			}
		};

		provider.attributeConverters = {
			top: {
				create: function(el) {
					var ctx = function(solver) {
						return ctx.top;
					};
					ctx.top = new c.Variable({
						value: el[0].offsetTop
					});
					return ctx;
				},
				materialize: function(el, ctx) {
					console.log(el, 'top', ctx.top.value + 'px');
					el.css('top', ctx.top.value + 'px');
				}
			},
			left: {
				create: function(el) {
					var ctx = function(solver) {
						return ctx.left;
					};
					ctx.left = new c.Variable({
						value: el[0].offsetLeft
					});
					return ctx;
				},
				materialize: function(el, ctx) {
					console.log(el, 'left', ctx.left.value + 'px');
					el.css('left', ctx.left.value + 'px');
				}
			},
			width: {
				create: function(el) {
					var initialWidth = el[0].offsetWidth;
					var ctx = function(solver) {
						solver.addConstraint(new c.Inequality(ctx.width, c.GEQ, 0, c.Strength.required));
						solver.addConstraint(new c.Inequality(ctx.width, c.GEQ, initialWidth, c.Strength.weak));
						return ctx.width;
					};
					ctx.width = new c.Variable({
						value: initialWidth
					});
					return ctx;
				},
				materialize: function(el, ctx) {
					console.log(el, 'width', ctx.width.value + 'px');
					el.css('width', ctx.width.value + 'px');
				}
			},
			height: {
				create: function(el) {
					var initialHeight = el[0].offsetHeight;
					var ctx = function(solver) {
						solver.addConstraint(new c.Inequality(ctx.height, c.GEQ, 0, c.Strength.required));
						solver.addConstraint(new c.Inequality(ctx.height, c.GEQ, initialHeight, c.Strength.weak));
						return ctx.height;
					};
					ctx.height = new c.Variable({
						value: initialHeight
					});
					return ctx;
				},
				materialize: function(el, ctx) {
					console.log(el, 'height', ctx.height.value + 'px');
					el.css('height', ctx.height.value + 'px');
				}
			},
			right: {
				create: function(el) {
					var leftCtx = Autolayout.attribute.left(el);
					var widthCtx = Autolayout.attribute.width(el);
					var ctx = function(solver) {
						leftCtx(solver);
						widthCtx(solver);
						return c.plus(ctx.left, ctx.width);
					}
					angular.extend(ctx, leftCtx, widthCtx);
					return ctx
				},
				materialize: function(el, ctx) {
					Autolayout.attribute.left(el, ctx);
					Autolayout.attribute.width(el, ctx);
				}
			},
			bottom: {
				create: function(el) {
					var leftCtx = Autolayout.attribute.top(el);
					var widthCtx = Autolayout.attribute.height(el);
					var ctx = function(solver) {
						leftCtx(solver);
						widthCtx(solver);
						return c.plus(ctx.top, ctx.height);
					}
					angular.extend(ctx, leftCtx, widthCtx);
					return ctx
				},
				materialize: function(el, ctx) {
					Autolayout.attribute.top(el, ctx);
					Autolayout.attribute.height(el, ctx);
				},
			}
		};

		function Autolayout(container) {
			if (!(this instanceof Autolayout)) {
				return new Autolayout(container);
			}
			this.containerElement = angular.element(container || Autolayout.$rootElement);
			var instance = this.containerElement.data('$autolayout');
			if (instance instanceof Autolayout) {
				return instance;
			} else {
				this.containerElement.data('$autolayout', this);
			}
		}

		Autolayout.prototype.addConstraint = function(constraint) {
			if (!constraint) {
				throw new Error("A constraint parameter should be defined.");
			}
		};

		provider.$get = ['$rootElement',
			function($rootElement) {
				Autolayout.$rootElement = $rootElement;
				return Autolayout;
			}
		];

	});

})(this);