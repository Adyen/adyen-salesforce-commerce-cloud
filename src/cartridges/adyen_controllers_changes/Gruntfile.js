'use strict';

var _ = require('lodash');
var path = require('path');
var dwdav = require('dwdav');
var configReader = require('@tridnguyen/config');

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    require('babel-core/register');

    // command line arguments
    var config = {};
    // tests args
    config.suite = grunt.option('suite') || '*';
    if (config.suite === 'all') { config.suite = '*'; }
    config.reporter = grunt.option('reporter') || 'spec';
    config.timeout = grunt.option('timeout') || 60000;
    config.url = grunt.option('url');
    config.client = grunt.option('client');
    config.locale = grunt.option('locale');
    config.port = grunt.option('port');
    config.sourcemaps = !!grunt.option('sourcemaps');

    var paths = require('./package.json').paths;

    grunt.initConfig({
        watch: {
            dev: {
                files: paths.css.map(function (path) {
                    return path.src + '*.scss';
                }),
                tasks: ['css']
            },
            styleguide: {
                files: paths.css.map(function (path) {
                    return path.src + '*.scss';
                }).push('doc/styleguide/scss/*.scss'),
                tasks: ['css:styleguide']
            },
            doc: {
                files: ['doc/js/**/*', '!doc/dist/', '!doc/.tmp', 'app_storefront_core/**/*.{js,ds}', 'app_storefront_controllers/**/*.{js,ds}'],
                tasks: ['jsdoc']
            },
            server: {
                files: [
                    'app_storefront_controllers/cartridge/**/*.{js,json,properties}',
                    'app_storefront_core/cartridge/**/*.{isml,json,properties,xml}',
                    'app_storefront_core/cartridge/scripts/**/*.{js,ds}',
                    'app_storefront_core/cartridge/static/**/*.{js,css,png,gif}',
                    'app_storefront_pipelines/cartridge/**/*.{properties,xml}'
                ],
                tasks: ['dwDavUpload'],
                options: {
                    spawn: false
                }
            }
        },
        sass: {
            dev: {
                options: {
                    style: 'expanded',
                    sourceMap: (config.sourcemaps)
                },
                files: paths.css.map(function (path) {
                    return {src: path.src + 'style.scss', dest: path.dest + 'style.css'};
                })
            },
            styleguide: {
                files: [{
                    'doc/dist/styleguide/main.css': 'doc/styleguide/scss/main.scss'
                }]
            }
        },
        autoprefixer: {
            dev: {
                files: paths.css.map(function (path) {
                    return {src: path.dest + 'style.css', dest: path.dest + 'style.css'};
                })
            },
            styleguide: {
                files: [{
                    'doc/dist/styleguide/main.css': 'doc/dist/styleguide/main.css'
                }]
            }
        },
        browserify: {
            dev: {
                files: paths.js.map(function (path) {
                    return {src: path.src + 'app.js', dest: path.dest + 'app.js'}
                }),
                options: {
                    browserifyOptions: {
                        debug: (config.sourcemaps)
                    }
                }
            },
            watchDev: {
                files: paths.js.map(function (path) {
                    return {src: path.src + 'app.js', dest: path.dest + 'app.js'}
                }),
                options: {
                    watch: true
                }
            },
            styleguide: {
                files: [{
                    src: 'doc/styleguide/js/main.js',
                    dest: 'doc/dist/styleguide/main.js'
                }],
                options: {
                    transform: ['hbsfy']
                }
            },
            watchStyleguide: {
                files: [{
                    src: 'doc/styleguide/js/main.js',
                    dest: 'doc/dist/styleguide/main.js'
                }],
                options: {
                    transform: ['hbsfy'],
                    watch: true
                }
            }
        },
        external_sourcemap: {
            browserify: {
                files: [{
                    dest: paths.js.dest,
                    src: paths.js.dest + 'app.js'
                }]
            }
        },
        connect: {
            doc: {
                options: {
                    port: config.port || 5000,
                    base: 'doc/dist'
                }
            }
        },
        eslint: {
            target: './'
        },
        mochaTest: {
            unit: {
                options: {
                    reporter: config.reporter,
                    timeout: config.timeout
                },
                src: ['test/unit/' + config.suite + '/**/*.js']
            }
        },
        webdriver: {
            application: _.assign({
                configFile: 'test/application/webdriver/wdio.conf.js'
            }, config)
        },
        'gh-pages': {
            doc: {
                src: '**/*',
                options: {
                    base: 'doc/dist',
                    clone: 'doc/.tmp',
                    message: 'Update ' + new Date().toISOString(),
                    repo: require('./doc/deploy.json').options.remoteUrl
                }
            }
        },
        jsdoc: {
            server: {
                src: ['app_storefront_controllers/README.md', '.'],
                options: {
                    destination: 'doc/dist/js/server',
                    configure: 'doc/js/server/conf.json'
                }
            },
            client: {
                src: ['app_storefront_core/cartridge/js/README.md', '.'],
                options: {
                    destination: 'doc/dist/js/client',
                    configure: 'doc/js/client/conf.json'
                }
            }
        },
        copy: {
            doc: {
                files: [
                    {'doc/dist/index.html': 'doc/index.html'},
                    {'doc/dist/styleguide/index.html': 'doc/styleguide/index.html'},
                    {expand: true, cwd: 'doc/styleguide', src: ['lib/**/*'], dest: 'doc/dist/styleguide'},
                    {expand: true, cwd: 'doc/styleguide', src: ['templates/**/*'], dest: 'doc/dist/styleguide'}
                ]
            }
        },
        dwDavUpload: {
            options: {
                authFile: './dw.json'
            },
            src: 'app_storefront_controllers/cartridge/controllers/Product.js'
        },
        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            dev: ['watch:dev', 'watch:server']
        }
    });

    grunt.registerMultiTask('dwDavUpload', 'webDav uploader for Salesforce Commerce Cloud', function () {
        var done = this.async();
        var options = this.options({authFile: 'dw.json'});
        var authFile = path.resolve(options.authFile);
        var credentials = configReader(authFile, {caller: false});
        grunt.log.ok('Loaded auth credentials from: ' + authFile);
        var server = dwdav(credentials);
        Promise.all(this.files.map(function (f) {
            var file = f.src;
            grunt.log.ok('Uploading ' + file[0]);
            return server.post(file[0]);
        })).then(function () {
            done(0);
        }).catch(function (err) {
            grunt.log.error(err);
            done(1);
        });
    });

    grunt.event.on('watch', function (action, filepath) {
        grunt.config('dwDavUpload.src', filepath);
    });

    grunt.registerTask('sourcemap', function () {
        if (config.sourcemaps) {
            grunt.task.run(['external_sourcemap:browserify']);
        }
    });
    grunt.registerTask('css', ['sass:dev', 'autoprefixer:dev']);
    grunt.registerTask('css:styleguide', ['sass:styleguide', 'autoprefixer:styleguide']);
    grunt.registerTask('default', ['css', 'browserify:watchDev', 'concurrent:dev']);
    grunt.registerTask('js', ['browserify:dev', 'sourcemap']);
    grunt.registerTask('test:application', ['webdriver:application']);
    grunt.registerTask('test:unit', ['mochaTest:unit']);
    grunt.registerTask('build', ['js', 'css']);
    grunt.registerTask('lint', ['eslint']);
    grunt.registerTask('styleguide', ['css:styleguide', 'browserify:watchStyleguide']);
    grunt.registerTask('doc', ['jsdoc:server', 'jsdoc:client', 'styleguide', 'copy:doc', 'connect:doc', 'watch']);
    grunt.registerTask('doc:deploy', ['jsdoc:server', 'jsdoc:client', 'styleguide', 'copy:doc', 'gh-pages:doc']);
};
