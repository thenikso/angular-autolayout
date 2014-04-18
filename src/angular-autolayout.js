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
		provider.autolayoutInstanceDataKey = '$autolayout';
		provider.autolayoutChildElementContextsDataKey = '$autolayoutContexts';
		provider.autolayoutContainerElementContextsDataKey = '$autolayoutContainerContexts';

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
				create: function(el, contEl) {
					var top = el.getBoundingClientRect().top - contEl.getBoundingClientRect().top;
					var ctx = function(solver) {
						if (el == contEl) {
							solver.addStay(ctx.top);
						}
						return ctx.top;
					};
					ctx.top = new c.Variable({
						value: top
					});
					return ctx;
				},
				materialize: function(el, ctx) {
					el.css('top', ctx.top.value + 'px');
				}
			},
			left: {
				create: function(el, contEl) {
					var left = el.getBoundingClientRect().left - contEl.getBoundingClientRect().left;
					var ctx = function(solver) {
						if (el == contEl) {
							solver.addStay(ctx.left);
						}
						return ctx.left;
					};
					ctx.left = new c.Variable({
						value: left
					});
					return ctx;
				},
				materialize: function(el, ctx) {
					el.css('left', ctx.left.value + 'px');
				}
			},
			width: {
				create: function(el, contEl) {
					var initialWidth = el.getBoundingClientRect().width;
					var ctx = function(solver) {
						if (el == contEl) {
							solver.addStay(ctx.width).addEditVar(ctx.width);
						} else {
							solver.addConstraint(new c.Inequality(ctx.width, c.GEQ, 0, c.Strength.required));
							solver.addConstraint(new c.Inequality(ctx.width, c.GEQ, initialWidth, c.Strength.weak));
						}
						return ctx.width;
					};
					ctx.width = new c.Variable({
						value: initialWidth
					});
					return ctx;
				},
				update: function(contEl, ctx, solver) {
					solver.suggestValue(ctx.width, contEl.getBoundingClientRect().width);
				},
				materialize: function(el, ctx) {
					el.css('width', ctx.width.value + 'px');
				}
			},
			height: {
				create: function(el, contEl) {
					var initialHeight = el.getBoundingClientRect().height;
					var ctx = function(solver) {
						if (el == contEl) {
							solver.addStay(ctx.height).addEditVar(ctx.height);
						} else {
							solver.addConstraint(new c.Inequality(ctx.height, c.GEQ, 0, c.Strength.required));
							solver.addConstraint(new c.Inequality(ctx.height, c.GEQ, initialHeight, c.Strength.weak));
						}
						return ctx.height;
					};
					ctx.height = new c.Variable({
						value: initialHeight
					});
					return ctx;
				},
				update: function(contEl, ctx, solver) {
					solver.suggestValue(ctx.height, contEl.getBoundingClientRect().height);
				},
				materialize: function(el, ctx) {
					el.css('height', ctx.height.value + 'px');
				}
			},
			right: {
				create: function(el, contEl) {
					var leftCtx = provider.contextCreatorForElementAttribute('left', el, contEl);
					var widthCtx = provider.contextCreatorForElementAttribute('width', el, contEl);
					var ctx = function(solver) {
						leftCtx(solver);
						widthCtx(solver);
						return c.plus(ctx.left, ctx.width);
					}
					angular.extend(ctx, leftCtx, widthCtx);
					return ctx
				},
				materialize: function(el, ctx) {
					provider.materializeContext('left', el, ctx);
					provider.materializeContext('width', el, ctx);
				}
			},
			bottom: {
				create: function(el, contEl) {
					var leftCtx = provider.contextCreatorForElementAttribute('top', el, contEl);
					var widthCtx = provider.contextCreatorForElementAttribute('height', el, contEl);
					var ctx = function(solver) {
						leftCtx(solver);
						widthCtx(solver);
						return c.plus(ctx.top, ctx.height);
					}
					angular.extend(ctx, leftCtx, widthCtx);
					return ctx
				},
				materialize: function(el, ctx) {
					provider.materializeContext('top', el, ctx);
					provider.materializeContext('height', el, ctx);
				},
			}
		};

		provider.contextCreatorForElementAttribute = function(prop, el, contEl) {
			var creator = provider.attributeConverters[prop];
			if (!creator || !creator.create) {
				throw new Error("Unknown attribute converter for: " + prop);
			}
			creator = creator.create;
			el = angular.element(el);
			contEl = angular.element(contEl);
			// Get relevant data name
			var dataKey = el[0] == contEl[0] ? provider.autolayoutContainerElementContextsDataKey : provider.autolayoutChildElementContextsDataKey;
			// Get or create `$autolayoutContexts` object
			var ctxs = el.data(dataKey);
			if (!angular.isObject(ctxs)) {
				ctxs = {};
				el.data(dataKey, ctxs);
			}
			// Return cached context if present
			ctx = ctxs[prop];
			if (angular.isDefined(ctx)) {
				return ctx;
			}
			// Generate autlayout context for property variable
			return ctxs[prop] = ctx = creator(el[0], contEl[0]);
		};

		provider.materializeContext = function(prop, el, ctx) {
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
			var instance = this.containerElement.data(provider.autolayoutInstanceDataKey);
			if (instance instanceof Autolayout) {
				return instance;
			} else {
				this.containerElement.data(provider.autolayoutInstanceDataKey, this);
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
			constraint.fromContext = angular.isFunction(constraint.fromAttribute) ? constraint.fromAttribute(
				constraint.fromElement
			) : provider.contextCreatorForElementAttribute(
				constraint.fromAttribute,
				constraint.fromElement,
				this.containerElement
			);
			constraint.toElement = angular.element(constraint.toElement || this.containerElement);
			if (constraint.toElement[0] != this.containerElement[0] && constraint.toElement[0].parentNode != this.containerElement[0]) {
				throw new Error("The toElement: " + constraint.toElement[0] + " should be a direct child of: " + this.containerElement[0]);
			}
			constraint.toElement.css('position', 'absolute');
			constraint.toContext = angular.isFunction(constraint.toAttribute) ? constraint.toAttribute(
				constraint.toElement
			) : provider.contextCreatorForElementAttribute(
				constraint.toAttribute,
				constraint.toElement,
				this.containerElement
			);
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
			var containerEl = this.containerElement[0];
			for (var i = this.constraints.length - 1; i >= 0; i--) {
				constraint = this.constraints[i];

				if (constraint.fromElement[0] != containerEl) {
					angular.isFunction(constraint.fromAttribute) ? constraint.fromAttribute(
						constraint.fromElement,
						constraint.fromContext
					) : provider.materializeContext(
						constraint.fromAttribute,
						constraint.fromElement,
						constraint.fromContext
					);
				}

				if (constraint.toElement[0] != containerEl) {
					angular.isFunction(constraint.toAttribute) ? constraint.toAttribute(
						constraint.toElement,
						constraint.toContext
					) : provider.materializeContext(
						constraint.toAttribute,
						constraint.toElement,
						constraint.toContext
					);
				}
			};
		};

		Autolayout.prototype.update = function() {
			var ctxs = this.containerElement.data(provider.autolayoutContainerElementContextsDataKey);
			var updater;
			var didEdit = false;
			var el = this.containerElement[0];
			for (prop in ctxs) {
				updater = provider.attributeConverters[prop];
				if (!updater || !updater.update) {
					continue;
				}
				if (!didEdit) {
					didEdit = true;
					this.solver.beginEdit();
				}
				updater.update(el, ctxs[prop], this.solver);
			}
			if (!didEdit) {
				return;
			}
			// Resolve and materialize update
			this.solver.resolve();
			this.solver.endEdit();
			this.materialize();
			// update child autolayout containers
			var children = this.containerElement.children();
			var childAutolayout;
			for (var i = children.length - 1; i >= 0; i--) {
				childAutolayout = angular.element(children[i]).data(provider.autolayoutInstanceDataKey);
				if (childAutolayout instanceof Autolayout) {
					childAutolayout.update();
				}
			};
		};

		Autolayout.prototype.destroy = function() {
			this.containerElement.data(provider.autolayoutInstanceDataKey, null);
			this.containerElement.data(provider.autolayoutContainerElementContextsDataKey, null);
			var children = this.containerElement.children();
			for (var i = children.length - 1; i >= 0; i--) {
				angular.element(children[i]).data(provider.autolayoutChildElementContextsDataKey, null);
			}
			this.constraints = [];
			this.solver = null;
		};

		provider.$get = ['$rootElement',
			function($rootElement) {
				Autolayout.$rootElement = $rootElement;
				return Autolayout;
			}
		];

	});

})(this);