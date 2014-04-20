(function(context) {

	// Define exported module
	angular.module('autolayout', ['ng']);

	// Expose cassowary
	var c = context.c;
	if (!c) {
		throw new Error("Cassowary missing!");
	}
	angular.module('autolayout').constant('cassowary', c);

	// Visual format parser
	var visualFormat = context.vistualFormatParser;
	if (!visualFormat) {
		throw new Error("Visual format parser missing!");
	}

	// Global counter to uniquely identify variables
	var varUID = 0;

	// Main `autolayout` service
	angular.module('autolayout').provider('autolayout', function() {

		var provider = this;

		provider.standardSpace = 8;
		provider.autolayoutInstanceDataKey = '$autolayout';
		provider.autolayoutChildElementExpressionsDataKey = '$autolayoutExpressions';
		provider.autolayoutContainerElementExpressionsDataKey = '$autolayoutContainerExpressions';
		provider.inc = function() {
			return varUID++;
		};

		provider.relations = {
			equal: function(a, b, priority) {
				var e;
				if (priority) {
					e = new c.Equation(a, b, new c.Strength("priority", 0, 0, priority));
				} else {
					e = new c.Equation(a, b, c.Strength.required);
				}
				return e;
			},
			greaterOrEqual: function(a, b, priority) {
				var e;
				if (priority) {
					e = new c.Inequality(a, c.GEQ, b, new c.Strength("priority", 0, 0, priority));
				} else {
					e = new c.Inequality(a, c.GEQ, b, c.Strength.required);
				}
				return e;
			},
			lessOrEqual: function(a, b, priority) {
				var e;
				if (priority) {
					e = new c.Inequality(a, c.LEQ, b, new c.Strength("priority", 0, 0, priority));
				} else {
					e = new c.Inequality(a, c.LEQ, b, c.Strength.required);
				}
				return e;
			}
		};

		provider.attributeConverters = {
			top: {
				create: function(el, contEl, solver) {
					var topValue = el.getBoundingClientRect().top - contEl.getBoundingClientRect().top;
					var topExp = new c.Variable({
						name: (el.id || provider.inc()) + '.top',
						value: topValue
					});
					if (el == contEl) {
						solver.addStay(topExp);
					}
					return topExp;
				},
				materialize: function(el, exp) {
					el.css('top', exp.value + 'px');
				}
			},
			left: {
				create: function(el, contEl, solver) {
					var leftValue = el.getBoundingClientRect().left - contEl.getBoundingClientRect().left;
					var leftExp = new c.Variable({
						name: (el.id || provider.inc()) + '.left',
						value: leftValue
					});
					if (el == contEl) {
						solver.addStay(leftExp);
					}
					return leftExp;
				},
				materialize: function(el, exp) {
					el.css('left', exp.value + 'px');
				}
			},
			width: {
				create: function(el, contEl, solver) {
					var widthValue = el.getBoundingClientRect().width;
					var widthExp = new c.Variable({
						name: (el.id || provider.inc()) + '.width',
						value: widthValue
					});
					if (el == contEl) {
						solver.addStay(widthExp).addEditVar(widthExp);
					} else {
						solver.addConstraint(new c.Inequality(widthExp, c.GEQ, 0, c.Strength.required));
						solver.addConstraint(new c.Inequality(widthExp, c.GEQ, widthValue, c.Strength.weak));
					}
					return widthExp;
				},
				update: function(contEl, exp, solver) {
					solver.suggestValue(exp, contEl.getBoundingClientRect().width);
				},
				materialize: function(el, exp) {
					el.css('width', exp.value + 'px');
				}
			},
			height: {
				create: function(el, contEl, solver) {
					var heightValue = el.getBoundingClientRect().height;
					var heightExp = new c.Variable({
						name: (el.id || provider.inc()) + '.height',
						value: heightValue
					});
					if (el == contEl) {
						solver.addStay(heightExp).addEditVar(heightExp);
					} else {
						solver.addConstraint(new c.Inequality(heightExp, c.GEQ, 0, c.Strength.required));
						solver.addConstraint(new c.Inequality(heightExp, c.GEQ, heightValue, c.Strength.weak));
					}
					return heightExp;
				},
				update: function(contEl, exp, solver) {
					solver.suggestValue(exp, contEl.getBoundingClientRect().height);
				},
				materialize: function(el, exp) {
					el.css('height', exp.value + 'px');
				}
			},
			right: {
				create: function(el, contEl, solver) {
					var leftExp = provider.expressionForElementAttribute('left', el, contEl, solver);
					var widthExp = provider.expressionForElementAttribute('width', el, contEl, solver);
					var rightExp = new c.Expression(leftExp).plus(widthExp);
					rightExp.leftPartExp = leftExp;
					rightExp.widthPartExp = widthExp;
					return rightExp;
				},
				materialize: function(el, exp) {
					provider.materializeExpressionValue('left', el, exp.leftPartExp);
					provider.materializeExpressionValue('width', el, exp.widthPartExp);
				}
			},
			bottom: {
				create: function(el, contEl, solver) {
					var topExp = provider.expressionForElementAttribute('top', el, contEl, solver);
					var heightExp = provider.expressionForElementAttribute('height', el, contEl, solver);
					var bottomExp = new c.Expression(topExp).plus(heightExp);
					bottomExp.topPartExp = topExp;
					bottomExp.heightPartExp = heightExp;
					return bottomExp;
				},
				materialize: function(el, exp) {
					provider.materializeExpressionValue('top', el, exp.topPartExp);
					provider.materializeExpressionValue('height', el, exp.heightPartExp);
				},
			}
		};

		provider.expressionForElementAttribute = function(prop, el, contEl, solver) {
			var creator = provider.attributeConverters[prop];
			if (!creator || !creator.create) {
				throw new Error("Unknown attribute converter for: " + prop);
			}
			creator = creator.create;
			el = angular.element(el);
			contEl = angular.element(contEl);
			// Get relevant data name
			var dataKey = el[0] == contEl[0] ? provider.autolayoutContainerElementExpressionsDataKey : provider.autolayoutChildElementExpressionsDataKey;
			// Get or create `$autolayoutContexts` object
			var exps = el.data(dataKey);
			if (!angular.isObject(exps)) {
				exps = {};
				el.data(dataKey, exps);
			}
			// Return cached context if present
			exp = exps[prop];
			if (angular.isDefined(exp)) {
				return exp;
			}
			// Generate autlayout context for property variable
			return exps[prop] = creator(el[0], contEl[0], solver);
		};

		provider.materializeExpressionValue = function(prop, el, exp) {
			var materializer = provider.attributeConverters[prop];
			if (!materializer || !materializer.materialize) {
				throw new Error("Unknown attribute converter for: " + prop);
			}
			materializer = materializer.materialize;
			return materializer(el, exp);
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
			if (angular.isString(constraint)) {
				var res = [];
				// Parse visual format language to:
				// {
				// 	orientation: "horizontal"|"vertical",
				// 	cascade: [
				// 		{
				// 			view: "viewName"|null,
				// 			constrains: [
				// 				{
				// 					relation: "equal"|"greaterOrEqual"|"lessOrEqual",
				// 					constant: positiveNumber
				// 				},
				// 				...
				// 			]
				// 		},
				// 		[
				// 			{
				// 				relation: "equal"|"greaterOrEqual"|"lessOrEqual",
				// 				constant: "default"|positiveNumber
				// 			},
				// 			...
				// 		],
				// 		...
				// 	]
				// }
				var parsed = visualFormat.parse(constraint);
				// Generate constraint parameters object template for external attributes
				// based on the position of the index in the parsed constraints cascade
				var makeExternalAttrTemplate = function(index, cascadeLimit) {
					var segment = index ? (index + 1 >= cascadeLimit ? 1 : 0) : -1;
					return parsed.orientation == 'vertical' ? {
						attribute: segment < 0 ? 'top' : 'bottom',
						toAttribute: segment < 1 ? 'top' : 'bottom'
					} : {
						attribute: segment < 0 ? 'left' : 'right',
						toAttribute: segment < 1 ? 'left' : 'right'
					}
				};
				// Loop in the cascade picking 3 elments at a time
				var cascadeLimit = parsed.cascade.length - 2;
				for (var i = 0; i < cascadeLimit; i += 2) {
					// Add attributes and elements to constraints parameters
					var template = angular.extend(makeExternalAttrTemplate(i, cascadeLimit), {
						element: document.getElementById(parsed.cascade[i].view),
						toElement: document.getElementById(parsed.cascade[i + 2].view)
					});
					// Loop in current triplet constraints
					var constraints = parsed.cascade[i + 1];
					for (var j = 0; j < constraints.length; j++) {
						// Decorate constraint parameters with relation, constant and priority
						constraint = angular.extend({}, template, constraints[j]);
						// Fix constant value
						if (constraint.constant == 'default') {
							constraint.constant = provider.standardSpace;
						}
						if (constraint.constant) {
							// Invert relations and constraint to reproduce expected behaviour
							if (constraint.relation == 'greaterOrEqual') {
								constraint.relation = 'lessOrEqual';
							} else if (constraint.relation == 'lessOrEqual') {
								constraint.relation = 'greaterOrEqual';
							}
							constraint.constant = -constraint.constant;
						}
						// Collect the actual constraint result
						res = res.concat(this.addConstraint(constraint));
					}
				}
				// Apply single element constraints
				var cascadeLimit = parsed.cascade.length;
				for (var i = 0; i < cascadeLimit; i += 2) {
					var constraints = parsed.cascade[i].constraints;
					if (!constraints || !constraints.length) {
						continue;
					}
					var template = {
						element: document.getElementById(parsed.cascade[i].view),
						attribute: parsed.orientation == 'vertical' ? 'height' : 'width'
					};
					for (var j = 0; j < constraints.length; j++) {
						constraint = angular.extend({}, template, constraints[j]);
						if (constraint.view) {
							constraint.toElement = document.getElementById(constraint.view);
							constraint.toAttribute = constraint.attribute;
							constraint.constant = 0;
							delete constraint.view;
						}
						res = res.concat(this.addConstraint(constraint));
					}
				}
				return res;
			}
			if (!angular.isObject(constraint)) {
				throw new Error("A constraint object argument is required.");
			}
			if (!constraint.element && !constraint.toElement) {
				throw new Error("A from or to element is required.");
			}
			if (constraint.element && !constraint.attribute) {
				throw new Error("An `attribute` for `element` is required.");
			}
			if (constraint.toElement && !constraint.toAttribute) {
				throw new Error("A `toAttribute` for `toElement` is required.");
			}
			if (!constraint.relation) {
				throw new Error("A `relation` parameter is required.");
			}
			constraint = angular.extend({}, constraint);
			constraint.element = angular.element(constraint.element || this.containerElement);
			if (constraint.element[0] != this.containerElement[0] && constraint.element[0].parentNode != this.containerElement[0]) {
				throw new Error("The element: " + constraint.element[0] + " should be a direct child of: " + this.containerElement[0]);
			}
			constraint.element.css('position', 'absolute');
			constraint.expression = angular.isFunction(constraint.attribute) ? constraint.attribute(
				constraint.element,
				this.containerElement,
				this.solver
			) : provider.expressionForElementAttribute(
				constraint.attribute,
				constraint.element,
				this.containerElement,
				this.solver
			);
			var relation = angular.isFunction(constraint.relation) ? constraint.relation : provider.relations[constraint.relation];
			if (!relation) {
				throw new Error("Unknown relation: " + constraint.relation);
			}
			constraint.relationFactory = relation;
			if (constraint.toAttribute) {
				// element-to-element constraint
				constraint.toElement = angular.element(constraint.toElement || this.containerElement);
				if (constraint.toElement[0] != this.containerElement[0] && constraint.toElement[0].parentNode != this.containerElement[0]) {
					throw new Error("The toElement: " + constraint.toElement[0] + " should be a direct child of: " + this.containerElement[0]);
				}
				constraint.toElement.css('position', 'absolute');
				constraint.toExpression = angular.isFunction(constraint.toAttribute) ? constraint.toAttribute(
					constraint.toElement,
					this.containerElement,
					this.solver
				) : provider.expressionForElementAttribute(
					constraint.toAttribute,
					constraint.toElement,
					this.containerElement,
					this.solver
				);
				constraint.$constraint = constraint.relationFactory(
					constraint.expression,
					c.plus(c.times(constraint.toExpression, constraint.multiplier || 1), constraint.constant || 0),
					constraint.priority
				);
			} else {
				// Element attribute constraint
				if (!angular.isNumber(constraint.constant)) {
					throw new Error("A numeric `constant` parameter is required.");
				}
				constraint.$constraint = constraint.relationFactory(
					constraint.expression,
					constraint.constant,
					constraint.priority
				);
			}
			if (!constraint.$constraint) {
				throw new Error("Unable to create constraint with parameters: " + constraint);
			}
			this.solver.addConstraint(constraint.$constraint);
			this.constraints.push(constraint);
			this.materialize();
			return [constraint];
		};

		Autolayout.prototype.removeConstraint = function(constraint) {
			if (angular.isArray(constraint)) {
				for (var i = constraint.length - 1; i >= 0; i--) {
					this.removeConstraint(constraint[i]);
				};
				return;
			}
			if (!constraint || !constraint.$constraint) {
				throw new Error("Can not remove invalid constraint: " + constraint);
			}
			var idx = this.constraints.indexOf(constraint);
			if (idx < 0) {
				return;
			}
			this.solver.removeConstraint(constraint.$constraint);
			this.constraints.splice(idx, 1);
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

				if (constraint.element[0] != containerEl) {
					angular.isFunction(constraint.attribute) ? constraint.attribute(
						constraint.element,
						constraint.expression
					) : provider.materializeExpressionValue(
						constraint.attribute,
						constraint.element,
						constraint.expression
					);
				}

				if (constraint.toElement && constraint.toElement[0] != containerEl) {
					angular.isFunction(constraint.toAttribute) ? constraint.toAttribute(
						constraint.toElement,
						constraint.toExpression
					) : provider.materializeExpressionValue(
						constraint.toAttribute,
						constraint.toElement,
						constraint.toExpression
					);
				}
			};
		};

		Autolayout.prototype.update = function() {
			var ctxs = this.containerElement.data(provider.autolayoutContainerElementExpressionsDataKey);
			var updater;
			var didEdit = false;
			var el = this.containerElement[0];
			for (var prop in ctxs) {
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
			this.containerElement.data(provider.autolayoutContainerElementExpressionsDataKey, null);
			var children = this.containerElement.children();
			for (var i = children.length - 1; i >= 0; i--) {
				angular.element(children[i]).data(provider.autolayoutChildElementExpressionsDataKey, null);
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

	// Autolayout directive `al-constraint`
	angular.module('autolayout').directive('alConstraint', ['autolayout',
		function(autolayout) {
			return {
				restrict: 'E',
				priority: 400,
				terminal: true,
				compile: function alConstraintCompile(element, attrs) {
					// Collect constraint options
					var visualFormat = attrs.visualFormat;
					var constraintOptions = {
						element: attrs.element,
						attribute: attrs.attribute,
						toElement: attrs.toElement,
						toAttribute: attrs.toAttribute,
						relation: attrs.relation,
						multiplier: parseFloat(attrs.multiplier) || 1,
						constant: parseFloat(attrs.constant) || 0,
						priority: parseInt(attrs.priority) || undefined
					};

					// Replace element with comment and remove it from the DOM
					var description = '';
					if (visualFormat) {
						description = visualFormat;
					} else {
						description = JSON.stringify(constraintOptions);
					}
					var comment = angular.element('<!-- al-constraint: ' + description + ' -->');
					element.after(comment);
					element.remove();

					return function alConstraintLink(scope, element, attrs) {
						var al = autolayout(element.parent());
						var cs = null;
						if (visualFormat) {
							cs = al.addConstraint(visualFormat);
						} else {
							constraintOptions.element = document.getElementById(constraintOptions.element);
							constraintOptions.toElement = document.getElementById(constraintOptions.toElement);
							cs = al.addConstraint(constraintOptions);
						}
						scope.$on('$destroy', function() {
							al.removeConstraint(cs);
						});
					}
				}
			}
		}
	]);

})(this);