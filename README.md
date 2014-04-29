# Autolayout for AngularJS

[Constraint based][1] layout paradigm for AngularJS web applications inspired by [Apple's Auto Layout][4] for iOS and OS X.

HTML and CSS have been designed to present a page style layout like one that
you might find on a newspaper. However, nowadays those technologies are also used
to for layout of applications that should resemble native ones.

Many features that are needed to properly layout an application are missing from
CSS. For example, there is no way to specify that two elements on a page should
have the same height!

With angular-autolayout, you can use the same layout technology that Apple gives
to native iOS and OS X developers for your HTML5 app.

## Usage

Install by cloning the repository or via Bower:

`bower install angular-autolayout`

Add `angular-autolayout` to your imported scripts:

    <script src="bower_components/angular/angular.js"></script>
    <script src="bower_components/angular-autolayout/dit/angular-autolayout.min.js"></script>

Require `autolayout` in your AngularJS app module:

```
angular.module("myApp", ["autolayout"]);
```

You can now use the `al-constraint` directive to add layout constraints with both Appple's [Visual Format Language][5] or by specifying parameters:

	<div id="myContainer">
		<div id="myLeftBox">Hello</div>
		<div id="myRightBox">Layout!</div>

		<al-constraint align="top">|-[myLeftBox(==myRightBox)]-[myRightBox]-|</al-constraint>
		<al-constriant>V:|-[myLeftBox]-|</al-constraint>
		<al-constraint
			element="myLeftBox"
			attribute="height"
			relation="equal"
			to-element="myRightBox"
			to-attribute="height"></al-constraint>
	</div>

Or programmatically in your controller:

```
angular.module("myApp").controller("myController", function(autolayout) {
	autolayout(document.getElementById("myContainer"))
		.addConstraint({
			element: document.getElementById("myLeftBox"),
			attribute: "right",
			toElement: document.getElementById("myRightBox"),
			toAttribute: "left",
			relation: "equal",
			constant: -10
		});
});
```

## Documentation

Angular-Autolayout is made to replicate Apple's Auto Layout for the web. The [Auto Layout Guide][4] provides some useful documentation that is relevant for this project.
Refer especially to the [Visual Format Languagee][5] documentation as it has been closely adopted.

### Directives

The preferred way of usage of angular-autolayout is via the provided directives:

**al-constraint**

The `al-constraint` is the core directive that will add layout constraints to its sibling elements relative to its parent element.

It can be used with both visual language format constraints:

```
<al-constriant visual-format="V:|-[myDiv]-|"></al-constraint>
```

or equivalent:

```
<al-constriant>V:|-[myDiv]-|</al-constraint>
```

Or it can be used in a form that will map to the programmatic API:

```
<al-constraint
	element="myLeftBox"
	attribute="height"
	relation="equal"
	to-element="myRightBox"
	to-attribute="height"
	multiplier="2"
	constant="10"
	priority="100"></al-constraint>
```

See examples for practical usages of this and other directives.

**al-update-on**

This is an attribute directive to be used on an autolayout container element. It expect a value that identify the name of an event upon which the autolayout should update an re-materialize. For example, in your view:

	<div id="containerDiv" al-update-on="myEvent">
		<div id="myBox">Content</div>
		<al-constraint>|[myBox]|</al-constraint>
	</div>

In you controller:

	angular.element("#containerDiv").css("width", "50%");
	scope.$broadcast("myEvent"); // This will trigger an update on the containerDiv's autolayout

**al-autolayout-on-resize**

The `al-autolayout-on-resize` attribute directive will update the autolayout of the container element it's defined on upon `window` resize. Because the update of an autolayout affects all the child autolayouts, this directive needs to be used only on the topmost autolayout in a hierarchy. For example:

	<div id="containerDiv" style="width:100%" al-update-on-resize>
		<div id="myBox">Content</div>
		<al-constraint>|[myBox]|</al-constraint>
	</div>


### Service

The only injectable service exposed is called `autolayout`. With it you can access to all the functionalities provided by the `al-constraint` directive via code.

**API**

- **`autolayout(containerElement)`** (constructor)

	Creates a new autolayout object and attach it to the given DOM element. It accepts both `angular.element`s or plain DOM elements such as those retrieved by `document.getElementById`. An instance created with this constructor will be referenced with `<autolayout>` in the rest of this document.

- **`<autolayout>.addConstraint(constraint, options)`**

	This is the main method of the library. It adds a constraint to the current layout and immediately applies it. It returns an `array` of constraints objects that can be used to remove specific constraints with `removeConstraint`. A single constraint object will resolve in the constraint expression:

	*element.attribute \<relation> toElement.toAttribute * multiplier + constant*

	The parameters are:

	**constraint**

	- A `string` in [Visual Format Language][5] that will result in the generation of one or more constraints;
	- An `object` with the following keys:
		- `element` is the first **DOM element** affected by the constraint. It can be `null` to refer to the container element used in the constructor. This element should either be the container element or a direct child of it;
		- `attribute` could be a string referring to an **attribute converter** like "left". It can also be a function, in which case it will be treated as a `create` converter's function receiving element, containerElement and solver. If a function is provided, it should implement the caching behavior of `provider.expressionForElementAttribute` by itself;
		- `toElement` is the second DOM element affected by the constraint. It can also be `null` but only if `element` is specified;
		- `toAttribute`, like `attribute` is the attribute converter for the `toElement`;
		- `multiplier` defaults to **1.0** and it's applied to the generated constraint expression as shown above;
		- `constant` defaults to **0** and it's applied to the generated constraint expression as shown above;
		- `priority`, if specified, makes the constraint not required and will respect other constraints priorities in order to resolve conflicting layout requests.

	**options**

	Options are currently considered only if the `constraint` parameter is a visual format language string. The available options in this case is:

	- `align` should be an attribute converter to be used in equation constraints between child elements found in a visual format language string. This will provide a convenient way to add such common constraints. See the examples for a more obvious explanation.

- **`<autolayout>.removeConstriant(constraint)`**

	Removes a constraint object or all the constraints in an array.

- **`<autolayout>.materialize()`**

	Materialize all the constrained variables values into CSS layout attributes. This method is automatically called when adding a new constraint.

- **`<autolayout>.update()`**

	Some container element's attributes may be updated with external values as they are never materialized by an autolayout having that element as it's container. When that happen, this method will update those values using converters' `prepareUpdate` and `update` functions and re-materialize the updated constraints values. This operation will be recursively applied to child autolayouts instances.

- **`<autolayout>.destroy()`**

	Destroy the autolayout instance and removes all the added data from the DOM elements.

### Provider

The `autolayout` service has an `autolayoutProvider` that can be injected in a module's `config` phase:

```
angular.module("myModule", ["autolayout"]).config(function(autolayoutProvider) {
	// Configure autolayoutProvider here
});
```

The `autolayoutProvider` allows your to configure many part of how the `autolayout` service behaves. The accessible configuration properties are:

- `standardSpace`: default to **8**, it is the **number** of pixels for the standard spacing used by visual language specified constraints such as `|-[ElemId]-|`. The spaces added by `|-` and `-|` depends by this parameter.
- `relations`: is a **map** of *relation names to functions* used to resolve the `relation` parameter of a constraint. By default, **equal**, **lessOrEqual** and **greaterOrEqual** relations are defined. A relation is defined as a `function (leftExp, rightExp, priority)` that returns a new Cassowary.js constraint such as `c.Equation` or `c.Inequality`.
- `attributeConverters`: a **map** of *attribute names to objects* to resolve `attribute` and `toAttribute` parameters of a constraint. By default, the **top**, **left**, **bottom**, **right**, **height**, **width**, **centerX** and **centerY** converters are defined. A converter object should define the following keys:
	- `create`: a `function (element, parentElement, solver)` that should return a Cassowary.js variable or expression;
	- `materialize`: a `function(element, expression)` that receives the expression generated by `create` and should apply the proper value to the provided element's layout style;
	- `update` (optional): a `function (containerElement, expression, solver)` called by the service `update` method that should call `solver.suggestValue` to update fix constraint variables;
	- `prepareUpdate` (optional): a `function(expression, solver)` called to prepare the solver to edit the given expression. The default implementation calls `solver.addEditVar` on the expression.
- `autolayoutInstanceDataKey`: default to *"$autolayout"* is the key used to store the autolayout instance in a container element's data;
- `autolayoutContainerElementExpressionsDataKey`: default to *"$autolayoutContainerExpressions"* is the key used to store created autolayout expressions in a container element's data;
- `autolayoutChildElementExpressionsDataKey`: default to *"$autolayoutExpressions"* is the key used to store created autolayout expressions in a child element's data.

The provider also exposes methods that are used to interact with `attributeConverters`:

- `expressionForElementAttribute`: is a `function(propertyName, element, containerElement, solver)` that can be used to execute the `create` function of a converter with the given property name, returning a Cassowary.js expression or variable. This method cashes requested expressions in the element's data using `autolayoutChildElementExpressionsDataKey` or `autolayoutContainerElementExpressionsDataKey`; this provides the desired property of always referring to the same Cassowary.js expression for a given element's attribute. To see how this method can be used in a custom attribute converter, take a look at the provided `width` converter in the sources;
- `materializeExpressionValue`: is a `function(propertyName, element, expression)` that has no expected return value and can be used to execute the `materialize` function of a converter.


**Cassowary.js**

[Cassowary.js][2] is included and provided as a constant via the injectable `cassowary`. Being it a constant, it can also be injected in the `config` phase to be used within `autolayoutProvider`'s configuration parameters.

## Setup project for development

To setup the project, you'll need a working node environment with [NPM](https://www.npmjs.org/), [Bower](http://bower.io/) and [Grunt](http://gruntjs.com/). When that is set up execute the following commands in a shell within the project directory:

```
npm install
bower install
```

### Run tests

There are a number of [Karma](http://karma-runner.github.io/0.12/index.html) based unit tests using [Mocha](http://visionmedia.github.io/mocha/), [Chai](http://chaijs.com/) and [Sinon](http://sinonjs.org/). To run them use:

`grunt test`

### Build

Building the project will generate a packaged `angular-autolayout.js` and it's minified version in the `dist` directory that are already provided for convenience. Build with:

`grunt build`

## Participate

This project uses [Cassowary.js][2] and [PEG][6], any contribution to those projects will help this project too.

The first thing you could do to partecipate to `angular-autolayout` is to use it in your project. By doing that you'll be more likely to find fixes or improvements that may be needed.

Some tasks that can be foreseen are:

- There is a workaround (that should be handled more nicely) to fix an exception thrown by Cassowary.js when the `endEdit` method of the solver is called rapidly by the `al-update-on-resize` directive;
- Fix bugs that arise with usage;
- Better error reporting;
- Support for responsive layouts?;
- Extend the functionalities provided by `angular-autolayout` to fit more specific needs;
- Use the (not very documented) power of Cassowary.js to allow more freedom in constraints creation;
- Performance profiling and fine tuning;
- A twin module that provides an Interface Builder like experience in creating constraints.

## License

The MIT License (MIT)

Copyright (c) 2014 Nicola Peduzzi

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[1]: http://en.wikipedia.org/wiki/Constraint_programming
[2]: https://github.com/slightlyoff/cassowary.js
[3]: http://www.cs.washington.edu/research/constraints/cassowary/
[4]: https://developer.apple.com/library/ios/documentation/userexperience/conceptual/AutolayoutPG/Introduction/Introduction.html
[5]: https://developer.apple.com/library/ios/documentation/userexperience/conceptual/AutolayoutPG/VisualFormatLanguage/VisualFormatLanguage.html
[6]: http://pegjs.majda.cz/