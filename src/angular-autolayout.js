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
	var _varUID = 0;

	// Main `autolayout` service
	angular.module('autolayout').provider('autolayout', function() {

		var provider = this;

		provider.standardSpace = 8;
		provider.autolayoutInstanceDataKey = '$autolayout';
		provider.autolayoutChildElementExpressionsDataKey = '$autolayoutExpressions';
		provider.autolayoutContainerElementExpressionsDataKey = '$autolayoutContainerExpressions';
		provider.varUID = function() {
			return 'v' + _varUID++;
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
						name: (el.id || provider.varUID()) + '.top',
						value: topValue
					});
					if (el == contEl) {
						solver.addStay(topExp, c.Strength.required);
					}
					return topExp;
				},
				materialize: function(el, exp) {
					el.css('top', Math.round(exp.value) + 'px');
				}
			},
			left: {
				create: function(el, contEl, solver) {
					var leftValue = el.getBoundingClientRect().left - contEl.getBoundingClientRect().left;
					var leftExp = new c.Variable({
						name: (el.id || provider.varUID()) + '.left',
						value: leftValue
					});
					if (el == contEl) {
						solver.addStay(leftExp, c.Strength.required);
					}
					return leftExp;
				},
				materialize: function(el, exp) {
					el.css('left', Math.round(exp.value) + 'px');
				}
			},
			width: {
				create: function(el, contEl, solver) {
					var widthValue = el.getBoundingClientRect().width;
					var widthExp = new c.Variable({
						name: (el.id || provider.varUID()) + '.width',
						value: widthValue
					});
					if (el == contEl) {
						widthExp.$stayConst = solver.addStay(widthExp, c.Strength.required);
					} else {
						solver.addConstraint(new c.Inequality(widthExp, c.GEQ, 0, c.Strength.required));
						solver.addConstraint(new c.Inequality(widthExp, c.GEQ, widthValue, c.Strength.weak));
					}
					return widthExp;
				},
				update: function(contEl, exp, solver) {
					solver.removeConstraint(exp.$stayConst);
					solver.suggestValue(exp, contEl.getBoundingClientRect().width);
					exp.$stayConst = solver.addStay(exp, c.Strength.required);
				},
				materialize: function(el, exp) {
					el.css('width', Math.round(exp.value) + 'px');
				}
			},
			height: {
				create: function(el, contEl, solver) {
					var heightValue = el.getBoundingClientRect().height;
					var heightExp = new c.Variable({
						name: (el.id || provider.varUID()) + '.height',
						value: heightValue
					});
					if (el == contEl) {
						heightExp.$stayConst = solver.addStay(heightExp, c.Strength.required);
					} else {
						solver.addConstraint(new c.Inequality(heightExp, c.GEQ, 0, c.Strength.required));
						solver.addConstraint(new c.Inequality(heightExp, c.GEQ, heightValue, c.Strength.weak));
					}
					return heightExp;
				},
				update: function(contEl, exp, solver) {
					solver.removeConstraint(exp.$stayConst);
					solver.suggestValue(exp, contEl.getBoundingClientRect().height);
					exp.$stayConst = solver.addStay(exp, c.Strength.required);
				},
				materialize: function(el, exp) {
					el.css('height', Math.round(exp.value) + 'px');
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
			},
			centerX: {
				create: function(el, contEl, solver) {
					var leftExp = provider.expressionForElementAttribute('left', el, contEl, solver);
					var widthExp = provider.expressionForElementAttribute('width', el, contEl, solver);
					var centerXExp = new c.Expression(widthExp).divide(2).plus(leftExp);
					centerXExp.leftPartExp = leftExp;
					centerXExp.widthPartExp = widthExp;
					return centerXExp;
				},
				materialize: function(el, exp) {
					provider.materializeExpressionValue('left', el, exp.leftPartExp);
					provider.materializeExpressionValue('width', el, exp.widthPartExp);
				}
			},
			centerY: {
				create: function(el, contEl, solver) {
					var topExp = provider.expressionForElementAttribute('top', el, contEl, solver);
					var heightExp = provider.expressionForElementAttribute('height', el, contEl, solver);
					var centerYExp = new c.Expression(heightExp).divide(2).plus(topExp);
					centerYExp.topPartExp = topExp;
					centerYExp.heightPartExp = heightExp;
					return centerYExp;
				},
				materialize: function(el, exp) {
					provider.materializeExpressionValue('top', el, exp.topPartExp);
					provider.materializeExpressionValue('height', el, exp.heightPartExp);
				}
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
			// Generate autolayout context for property variable
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

		Autolayout.prototype.addConstraint = function(constraint, options) {
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
				// Utility for error reporting
				var constraintString = constraint;
				var conflictAtPosition = function(pos) {
					var err = 'Conflict when adding constraint:\n' + constraintString + '\n';
					for (var i = pos - 1; i >= 0; i--) {
						err += '-';
					}
					err += '^';
					return new Error(err);
				};
				// Generate constraint parameters object template for external attributes
				// based on wether the template elements are the container element.
				var containerElement = this.containerElement[0];
				var addExternalAttrs = function(template) {
					var segment = 0;
					if (!template.element || template.element == containerElement) {
						segment = -1;
					} else if (!template.toElement || template.toElement == containerElement) {
						segment = 1;
					}
					return angular.extend(template, parsed.orientation == 'vertical' ? {
						attribute: segment < 0 ? 'top' : 'bottom',
						toAttribute: segment < 1 ? 'top' : 'bottom'
					} : {
						attribute: segment < 0 ? 'left' : 'right',
						toAttribute: segment < 1 ? 'left' : 'right'
					})
				};
				// An options.align can be scpecified to add additional constraints
				// to the opposite orientation of all the elements.
				var alignConstraint = null;
				if (options && options.align) {
					alignConstraint = {
						attribute: options.align,
						relation: 'equal',
						toAttribute: options.align
					};
				}
				// Loop in the cascade picking 3 elments at a time
				var cascadeLimit = parsed.cascade.length - 2;
				for (var i = 0; i < cascadeLimit; i += 2) {
					// Add attributes and elements to constraints parameters
					var template = addExternalAttrs({
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
						try {
							res = res.concat(this.addConstraint(constraint));
						} catch (e) {
							throw (e instanceof c.RequiredFailure) ? conflictAtPosition(constraint.$parserOffset) : e;
						}
					}
					// Add align constraint
					if (alignConstraint && template.element && template.toElement) {
						res = res.concat(this.addConstraint(angular.extend({}, template, alignConstraint)));
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
						try {
							res = res.concat(this.addConstraint(constraint));
						} catch (e) {
							throw (e instanceof c.RequiredFailure) ? conflictAtPosition(constraint.$parserOffset) : e;
						}
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
			if (constraint.element[0] != this.containerElement[0]) {
				constraint.element.css('position', 'absolute');
			}
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
				if (constraint.toElement[0] != this.containerElement[0]) {
					constraint.toElement.css('position', 'absolute');
				}
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
			var exps = this.containerElement.data(provider.autolayoutContainerElementExpressionsDataKey);
			var el = this.containerElement[0];
			// Build an updater array of functions to call to update required
			// contaner element attributes.
			var prepareUpdates = {}, updates = {}, updatesCount = 0;
			var updater;
			for (var prop in exps) {
				updater = provider.attributeConverters[prop];
				if (!updater || !updater.update) {
					continue;
				}
				updatesCount++;
				prepareUpdates[prop] = updater.prepareUpdate || function(exp, solver) {
					solver.addEditVar(exp);
				};
				updates[prop] = updater.update;
			}
			// Return if no updates required
			if (updatesCount = 0) {
				return;
			}
			// Prepare updates
			for (var prop in prepareUpdates) {
				prepareUpdates[prop](exps[prop], this.solver);
			}
			// Perform updates
			try {
				this.solver.beginEdit();
				for (var prop in updates) {
					updates[prop](el, exps[prop], this.solver);
				}
				this.solver.endEdit();
			} catch (e) {
				// FIXME Unspeakable disaster. Rebuilding everything
				var materialize = this.materialize;
				this.materialize = function() {};
				this.containerElement.data(provider.autolayoutContainerElementExpressionsDataKey, null);
				var children = this.containerElement.children();
				for (var i = children.length - 1; i >= 0; i--) {
					angular.element(children[i]).data(provider.autolayoutChildElementExpressionsDataKey, null);
				}
				this.solver = new c.SimplexSolver();
				var constraints = this.constraints;
				this.constraints = [];
				for (var i = constraints.length - 1; i >= 0; i--) {
					this.addConstraint(constraints[i]);
				};
				this.materialize = materialize;
			}
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
	angular.module('autolayout').directive('alConstraint', ['autolayout', '$interpolate',
		function(autolayout, $interpolate) {
			return {
				restrict: 'E',
				priority: 900,
				terminal: true,
				compile: function alConstraintCompile(element, attrs) {
					// Support ng-if attribute
					var ngIfExp = attrs.ngIf;

					// Collect constraint options
					var visualFormatText = (attrs.visualFormat || element.text()).trim(),
						visualFormat = visualFormatText && $interpolate(visualFormatText, true) || visualFormatText,
						visualFormatAlign = attrs.align && $interpolate(attrs.align, true) || attrs.align;
					var constraintOptionsObj = null,
						constraintOptions = null;
					if (!visualFormat) {
						constraintOptionsObj = {
							element: attrs.element,
							attribute: attrs.attribute,
							toElement: attrs.toElement,
							toAttribute: attrs.toAttribute,
							relation: attrs.relation,
							multiplier: attrs.multiplier,
							constant: attrs.constant,
							priority: attrs.priority
						};
						constraintOptions = $interpolate(JSON.stringify(constraintOptionsObj), true) || constraintOptionsObj;
						if (!angular.isFunction(constraintOptions)) {
							constraintOptions.multiplier = parseFloat(constraintOptions.multiplier) || 1;
							constraintOptions.constant = parseFloat(constraintOptions.constant) || 0;
							constraintOptions.priority = parseInt(constraintOptions.priority) || undefined;
						}
					}

					// Replace element with comment and remove it from the DOM
					var description = '';
					if (visualFormatText) {
						description = visualFormatText;
						if (attrs.align) {
							description += ' (align: ' + attrs.align + ')'
						}
					} else {
						description = JSON.stringify(constraintOptionsObj);
					}
					if (ngIfExp) {
						description += ' if: ' + ngIfExp;
					}
					var comment = angular.element('<!-- al-constraint: ' + description + ' -->');
					element.after(comment);
					element.remove();

					return function alConstraintLink(scope, element, attrs) {
						var al = autolayout(element.parent());
						if (!al) {
							throw new Error("Unable to create autolayout from: " + element.parent());
						}
						var createConstraints = function() {
							var cs = null;
							// Visual format constraint
							if (visualFormat) {
								if (angular.isFunction(visualFormat)) {
									if (!angular.isFunction(visualFormatAlign)) {
										var visualFormatAlignText = visualFormatAlign;
										visualFormatAlign = function() {
											return visualFormatAlignText;
										};
									}
									scope.$watch(function() {
										return JSON.stringify([visualFormat(scope), visualFormatAlign(scope)]);
									}, function(params) {
										params = JSON.parse(params);
										if (cs) {
											al.removeConstraint(cs);
										}
										cs = al.addConstraint(params[0], {
											align: params[1]
										});
									});
								} else if (angular.isFunction(visualFormatAlign)) {
									scope.$watch(function() {
										return visualFormatAlign(scope);
									}, function(align) {
										if (cs) {
											al.removeConstraint(cs);
										}
										cs = al.addConstraint(visualFormat, {
											align: align
										});
									});
								} else {
									cs = al.addConstraint(visualFormat, {
										align: visualFormatAlign
									});
								}
							} else {
								var addConstraintFormOptions = function(constraintOptions) {
									if (cs) {
										al.removeConstraint(cs);
									}
									constraintOptions.element = document.getElementById(constraintOptions.element);
									constraintOptions.toElement = document.getElementById(constraintOptions.toElement);
									cs = al.addConstraint(constraintOptions);
								};
								if (angular.isFunction(constraintOptions)) {
									scope.$watch(function() {
										return constraintOptions(scope);
									}, function(constraintOptions) {
										var constraintOptions = JSON.parse(constraintOptions);
										constraintOptions.multiplier = parseFloat(constraintOptions.multiplier) || 1;
										constraintOptions.constant = parseFloat(constraintOptions.constant) || 0;
										constraintOptions.priority = parseInt(constraintOptions.priority) || undefined;
										addConstraintFormOptions(constraintOptions);
									});
								} else {
									addConstraintFormOptions(constraintOptions);
								}
							}
							return cs;
						};
						// Manage constraints creation and removal
						var cs = null;
						if (ngIfExp) {
							scope.$watch(ngIfExp, function(value) {
								if (value && !cs) {
									// Allaw other conditional constraints to be removed
									scope.$evalAsync(function() {
										cs = createConstraints();
									});
								} else if (cs) {
									al.removeConstraint(cs);
									cs = null;
								}
							});
						} else {
							cs = createConstraints();
						}
						scope.$on('$destroy', function() {
							if (cs) {
								al.removeConstraint(cs);
							}
						});
					}
				}
			}
		}
	]);

	angular.module('autolayout').directive('alUpdateOn', ['autolayout',
		function(autolayout) {
			return {
				restrict: 'AC',
				link: function(scope, element, attrs) {
					if (!attrs.alUpdateOn) {
						throw new Error("Event name required in `al-update-on`");
					}
					var al = autolayout(element);
					scope.$on(attrs.alUpdateOn, function() {
						al.update();
					});
				}
			}
		}
	]);

	angular.module('autolayout').directive('alUpdateOnResize', ['autolayout',
		function(autolayout) {
			var autolayoutsToUpdate = [];
			var locked = false;
			var resizeHandler = function() {
				for (var i = autolayoutsToUpdate.length - 1; i >= 0; i--) {
					autolayoutsToUpdate[i].update();
				};
			};

			function addAutolayoutToUpdate(al) {
				if (autolayoutsToUpdate.length == 0) {
					angular.element(window).bind('resize', resizeHandler);
				}
				autolayoutsToUpdate.push(al);
			}

			function removeAutolayoutToUpdate(al) {
				autolayoutsToUpdate.splice(autolayoutsToUpdate.indexOf(al), 1);
				if (autolayoutsToUpdate.length == 0) {
					angular.element(window).unbind('resize', resizeHandler);
				}
			}
			return {
				restrict: 'AC',
				link: function(scope, element, attrs) {
					var al = autolayout(element);
					addAutolayoutToUpdate(al);
					scope.$on('$destroy', function() {
						removeAutolayoutToUpdate(al);
					});
				}
			}
		}
	]);

})(this);