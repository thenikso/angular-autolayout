(function(context) {

	// Define exported module
	angular.module('autolayout', ['ng']);

	// Expose cassowary
	var c = context.c;
	angular.module('autolayout').constant('cassowary', c);

	// Main `autolayout` service
	angular.module('autolayout').provider('autolayout', function() {

		var provider = this;

		provider.defaultPriority = 1000;

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
					var leftCtx = provider.contextCreatorForElementAttribute(el, 'left');
					var widthCtx = provider.contextCreatorForElementAttribute(el, 'width');
					var ctx = function(solver) {
						leftCtx(solver);
						widthCtx(solver);
						return c.plus(ctx.left, ctx.width);
					}
					angular.extend(ctx, leftCtx, widthCtx);
					return ctx
				},
				materialize: function(el, ctx) {
					provider.materializeContext(el, 'left', ctx);
					provider.materializeContext(el, 'width', ctx);
				}
			},
			bottom: {
				create: function(el) {
					var leftCtx = provider.contextCreatorForElementAttribute(el, 'top');
					var widthCtx = provider.contextCreatorForElementAttribute(el, 'height');
					var ctx = function(solver) {
						leftCtx(solver);
						widthCtx(solver);
						return c.plus(ctx.top, ctx.height);
					}
					angular.extend(ctx, leftCtx, widthCtx);
					return ctx
				},
				materialize: function(el, ctx) {
					provider.materializeContext(el, 'top', ctx);
					provider.materializeContext(el, 'height', ctx);
				},
			}
		};

		provider.contextCreatorForElementAttribute = function(el, prop) {
			var creator = provider.attributeConverters[prop];
			if (!creator || !creator.create) {
				throw new Error("Unknown attribute converter for: " + prop);
			}
			creator = creator.create;
			el = angular.element(el);
			// Get or create `$autolayoutContexts` object
			var ctxs = el.data('$autolayoutContexts');
			if (!angular.isObject(ctxs)) {
				ctxs = {};
				el.data('$autolayoutContexts', ctxs);
			}
			// Return cached context if present
			ctx = ctxs[prop];
			if (angular.isDefined(ctx)) {
				return ctx;
			}
			// Generate autlayout context for property variable
			return ctxs[prop] = ctx = creator(el);
		};

		provider.materializeContext = function(el, prop, ctx) {
			var materializer = provider.attributeConverters[prop];
			if (!materializer || !materializer.materialize) {
				throw new Error("Unknown attribute converter for: " + prop);
			}
			materializer = materializer.materialize;
			return materializer(el, ctx);
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
			this.solver = new c.SimplexSolver();
			this.constraints = [];
			// Position container element to be the offset parent
			var position = this.containerElement.css('position');
			if (position != 'absolute' || position != 'relative' || position != 'fixed') {
				this.containerElement.css('position', 'relative');
			}
		}

		Autolayout.prototype.addConstraint = function(constraint) {
			if (!angular.isObject(constraint)) {
				throw new Error("A constraint object argument is required.");
			}
			if (!constraint.fromElement && !constraint.toElement) {
				throw new Error("A from or to element is required.");
			}
			if (!constraint.fromAttribute || !constraint.toAttribute) {
				throw new Error("A fromAttribute and toAttribute are required.");
			}
			if (!constraint.relatedBy) {
				throw new Error("A relatedBy parameter is required.");
			}
			constraint = angular.extend({}, constraint);
			constraint.fromElement = angular.element(constraint.fromElement || this.containerElement);
			if (constraint.fromElement[0] != this.containerElement[0] && constraint.fromElement[0].parentNode != this.containerElement[0]) {
				throw new Error("The fromElement: " + constraint.fromElement[0] + " should be a direct child of: " + this.containerElement[0]);
			}
			constraint.fromElement.css('position', 'absolute');
			constraint.fromContext = angular.isFunction(constraint.fromAttribute) ? constraint.fromAttribute(constraint.fromElement) : provider.contextCreatorForElementAttribute(constraint.fromElement, constraint.fromAttribute);
			constraint.toElement = angular.element(constraint.toElement || this.containerElement);
			if (constraint.toElement[0] != this.containerElement[0] && constraint.toElement[0].parentNode != this.containerElement[0]) {
				throw new Error("The toElement: " + constraint.toElement[0] + " should be a direct child of: " + this.containerElement[0]);
			}
			constraint.toElement.css('position', 'absolute');
			constraint.toContext = angular.isFunction(constraint.toAttribute) ? constraint.toAttribute(constraint.toElement) : provider.contextCreatorForElementAttribute(constraint.toElement, constraint.toAttribute);
			var relatedBy = angular.isFunction(constraint.relatedBy) ? constraint.relatedBy : provider.relations[constraint.relatedBy];
			if (!relatedBy) {
				throw new Error("Unknown relation: " + constraint.relatedBy);
			}
			constraint.relatedByFactory = relatedBy;
			constraint.$constraint = constraint.relatedByFactory(
				constraint.fromContext(this.solver),
				c.plus(c.times(constraint.toContext(this.solver), constraint.multiplier || 1), constraint.constant || 0),
				constraint.priority || provider.defaultPriority
			);
			if (!constraint.$constraint) {
				throw new Error("Unable to create constraint with parameters: " + constraint);
			}
			this.solver.addConstraint(constraint.$constraint);
			this.constraints.push(constraint);
			this.materialize();
			return constraint;
		};

		Autolayout.prototype.materialize = function() {
			// Materialize only if container element is in the document
			var shouldContinue = false;
			var element = this.containerElement[0];
			while (element = element.parentNode) {
				if (element == document) {
					shouldContinue = true;
					break;
				}
			}
			if (!shouldContinue) {
				return;
			}
			//
			var constraint;
			for (var i = this.constraints.length - 1; i >= 0; i--) {
				constraint = this.constraints[i];

				angular.isFunction(constraint.fromAttribute) ? constraint.fromAttribute(
					constraint.fromElement,
					constraint.fromContext
				) : provider.materializeContext(
					constraint.fromElement,
					constraint.fromAttribute,
					constraint.fromContext
				);

				angular.isFunction(constraint.toAttribute) ? constraint.toAttribute(
					constraint.toElement,
					constraint.toContext
				) : provider.materializeContext(
					constraint.toElement,
					constraint.toAttribute,
					constraint.toContext
				);
			};
		};

		provider.$get = ['$rootElement',
			function($rootElement) {
				Autolayout.$rootElement = $rootElement;
				return Autolayout;
			}
		];

	});

})(this);