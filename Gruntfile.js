'use strict';

module.exports = function (grunt) {

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
            'dist/*',
            '!dist/.git*'
          ]
        }]
      }
    },

    ngmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp',
          src: '*.js',
          dest: '.tmp'
        }]
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
        src: ['node_modules/cassowary/bin/c.js', 'src/*.js'],
        dest: 'dist/angular-autolayout.js',
      },
    },

    uglify: {
      dist: {
        files: {
          'dist/angular-autolayout.min.js': [
            'dist/angular-autolayout.js'
          ]
        }
      }
    },

  });

  grunt.registerTask('build', [
    'clean:dist',
    'ngmin',
    'concat',
    'uglify'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
};
