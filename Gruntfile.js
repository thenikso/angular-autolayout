'use strict';

module.exports = function(grunt) {

	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

	// Time how long tasks take. Can help when optimizing build times
	require('time-grunt')(grunt);

	// Define the configuration for all the tasks
	grunt.initConfig({

		clean: {
			dist: {
				files: [{
					dot: true,
					src: [
						'.tmp',
						'angular-autolayout*.js'
					]
				}]
			}
		},

		ngmin: {
			dist: {
				files: [{
					expand: true,
					cwd: 'src',
					src: '*.js',
					dest: '.tmp'
				}]
			}
		},

		peg: {
			dist: {
				src: 'src/visual-format-grammar.peg',
				dest: '.tmp/visual-format-parser.js',
				options: {
					exportVar: "this.vistualFormatParser"
				}
			}
		},

		concat: {
			options: {
				separator: ';',
				stripBanners: false,
				banner: '(function () { angular.bind({}, function(){',
				footer: '})()})();'
			},
			dist: {
				src: ['node_modules/cassowary/bin/c.js', '.tmp/visual-format-parser.js', '.tmp/angular-autolayout.js'],
				dest: 'angular-autolayout.js',
			},
		},

		uglify: {
			dist: {
				files: {
					'angular-autolayout.min.js': [
						'angular-autolayout.js'
					]
				}
			}
		},

		karma: {
			unit: {
				configFile: 'karma.conf.js'
			}
		},

	});

	grunt.registerTask('build', [
		'clean:dist',
		'peg',
		'ngmin',
		'concat',
		'uglify'
	]);

	grunt.registerTask('test', [
		'peg',
		'karma'
	]);

	grunt.registerTask('default', [
		'build'
	]);
};