// Generated on 2013-11-14 using generator-angular 0.6.0-rc.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.initConfig({
    yeoman: {
      // configurable paths
      app: require('./bower.json').appPath || 'app',
      dist: 'dist'
    },
    watch: {
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= yeoman.app %>/{,*/}*.html',
          '.tmp/styles/{,*/}*.css',
          '{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
          '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          base: [
            '.tmp',
            '<%= yeoman.app %>'
          ]
        }
      },
      test: {
        options: {
          port: 9001,
          base: [
            '.tmp',
            'test',
            '<%= yeoman.app %>'
          ]
        }
      },
      dist: {
        options: {
          base: '<%= yeoman.dist %>'
        }
      }
    },
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/*',
            '!<%= yeoman.dist %>/.git*'
          ]
        }]
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: [
        'Gruntfile.js',
        'src/{,*/}*.js'
      ]
    },
    // not used since Uglify task does concat,
    // but still available if needed
    concat: {
      files: {
        '<%= yeoman.dist %>/offlineHttp.js': [
          '*.js',
          '!*-spec.js'
        ]
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      },
      singleRun: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },
    ngmin: {
      dist: {
        files: [{
          expand: true,
          flatten: true,
          src: ['src/*.js', '!src/*-spec.js'],
          dest: 'dist'
        }]
      }
    },
    ngdocs: {
      options: {
        dest: 'dist/docs',
        scripts: [
          'angular.js',
          'dist/storeAndForward.js'
        ],
        styles: [],
        // navTemplate: 'docs/nav.html',
        title: 'storeAndForward',
        html5Mode: false
      },
      api: {
        src: ['src/*.js', '!src/*-spec.js'],
        title: 'API Documentation'
      }
    },
    uglify: {
      dist: {
        files: {
          '<%= yeoman.dist %>/storeAndForward.min.js': [
            'dist/storeAndForward.js'
          ]
        }
      }
    }
  });

  grunt.registerTask('test', [
    'clean',
    'connect:test',
    'karma:unit'
  ]);

  grunt.registerTask('build', [
    'clean',
    'ngmin',
    'uglify'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'karma:singleRun',
    'build',
    'ngdocs'
  ]);
};
