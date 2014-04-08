# Autolayout for AngularJS

An attempt to port [Apple's Autoalyout](https://developer.apple.com/library/ios/documentation/userexperience/conceptual/AutolayoutPG/VisualFormatLanguage/VisualFormatLanguage.html#//apple_ref/doc/uid/TP40010853-CH3-SW1) used in Interface Builder to AngularJS.

Use constraint based layout to position HTML elements on a page using AngularJS.

This project uses [Cassowary.js constraint solver](https://github.com/slightlyoff/cassowary.js)
which is an optimized javascript version of the
[Cassowary hierarchial constraint toolkit](http://www.cs.washington.edu/research/constraints/cassowary/)
used by Apple in Interface Builder for XCode.

## Run tests

1. Start the Selenium server:
`./node_modules/.bin/webdriver-manager start`

2. Open a new terminal and run Protractor:
`./node_modules/.bin/protractor protractor-config.js`
