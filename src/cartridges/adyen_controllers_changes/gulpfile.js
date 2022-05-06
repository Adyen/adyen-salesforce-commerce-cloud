'use strict';
var gulp = require('gulp');
var gutil = require('gulp-util');
var minimist = require('minimist');
var _ = require('lodash');
var sourcemaps = require('gulp-sourcemaps');

var pkg = require('./package.json');
var paths = pkg.paths;
var opts = minimist(process.argv.slice(2));

require('babel-core/register');

var gif = require('gulp-if');
var merge = require('merge-stream');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');

gulp.task('css', function () {
	var streams = merge();
	paths.css.forEach(function (path) {
		streams.add(gulp.src(path.src + '*.scss')
			.pipe(gif(gutil.env.sourcemaps, sourcemaps.init()))
			.pipe(sass())
			.pipe(prefix({cascade: true}))
			.pipe(gif(gutil.env.sourcemaps, sourcemaps.write('./')))
			.pipe(gulp.dest(path.dest)));
	});
	return streams;
});

var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var eventStream = require('event-stream');
var watching = false;
gulp.task('enable-watch-mode', function () {watching = true;});
gulp.task('js', function (done) {
	function createBundler (path) {
		var opts = {
			entries: './' + path.src + 'app.js', // browserify requires relative path
			debug: gutil.env.sourcemaps
		};
		if (watching) {
			opts = Object.assign(opts, watchify.args);
		}
		var bundler = browserify(opts);
		if (watching) {
			bundler = watchify(bundler);
		}
		// optionally transform
		// bundler.transform('transformer');

		bundler.on('update', function (ids) {
			gutil.log('File(s) changed: ' + gutil.colors.cyan(ids));
			gutil.log('Rebundling...');
			rebundle(bundler, path);
		});

		bundler.on('log', gutil.log);
		return bundler;
	}
	function rebundle (bundler, path) {
		return bundler.bundle()
			.on('error', function (e) {
				gutil.log('Browserify Error', gutil.colors.red(e));
			})
			.pipe(source('app.js'))
			// sourcemaps
				.pipe(buffer())
				.pipe(sourcemaps.init({loadMaps: true}))
				.pipe(sourcemaps.write('./'))
			//
			.pipe(gulp.dest(path.dest));
	}
	return eventStream.merge(paths.js.map(function (path) {
		var b = createBundler(path);
		return rebundle(b, path);
	}));
});

var dwdav = require('dwdav');
var path = require('path');
var config = require('@tridnguyen/config');
function upload (files) {
	var credentials = config('dw.json', {caller: false});
	var server = dwdav(credentials);
	Promise.all(files.map(function (f) {
		return server.post(path.relative(process.cwd(), f));
	})).then(function() {
		gutil.log(gutil.colors.green('Uploaded ' + files.join(',') + ' to the server'));
	}).catch(function(err) {
		gutil.log(gutil.colors.red('Error uploading ' + files.join(','), err));
	});
}

var eslint = require('gulp-eslint');
gulp.task('lint', function() {
	return gulp.src('./**/*.js')
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

var webdriver = require('gulp-webdriver');
gulp.task('test:application', function () {
	return gulp.src('test/application/webdriver/wdio.conf.js')
		.pipe(webdriver(_.omit(opts, '_')));
});

var gulpMocha = require('gulp-mocha');
gulp.task('test:unit', function () {
	var reporter = opts.reporter || 'spec';
	var timeout = opts.timeout || 10000;
	var suite = opts.suite || '*';
	return gulp.src(['test/unit/' + suite + '/**/*.js'], {read: false})
		.pipe(gulpMocha({
			reporter: reporter,
			timeout: timeout
		}));
});

gulp.task('build', ['js', 'css']);

gulp.task('watch:server', function() {
    gulp.watch(['app_storefront_controllers/cartridge/**/*.{js,json,properties}',
                    'app_storefront_core/cartridge/**/*.{isml,json,properties,xml}',
                    'app_storefront_core/cartridge/scripts/**/*.{js,ds}',
                    'app_storefront_core/cartridge/static/**/*.{js,css,png,gif}',
                    'app_storefront_pipelines/cartridge/**/*.{properties,xml}'], {}, function(event) {
                        upload([event.path]);
                    }
    );
});

gulp.task('default', ['enable-watch-mode', 'js', 'css', 'watch:server'], function () {
	gulp.watch(paths.css.map(function (path) {
		return path.src + '**/*.scss';
	}), ['css']);
});

var hbsfy = require('hbsfy');
var styleguideWatching = false;
gulp.task('styleguide-watching', function () {styleguideWatching = true;});
gulp.task('js:styleguide', function () {
	var opts = {
		entries: ['./styleguide/js/main.js'],
		debug: (gutil.env.sourcemaps)
	};
	if (styleguideWatching) {
		opts = Object.assign(opts, watchify.args);
	}
	var bundler = browserify(opts);
	if (styleguideWatching) {
		bundler = watchify(bundler);
	}

	// transforms
	bundler.transform(hbsfy);

	bundler.on('update', function (ids) {
		gutil.log('File(s) changed: ' + gutil.colors.cyan(ids));
		gutil.log('Rebundling...');
		bundle();
	});

	var bundle = function () {
		return bundler
			.bundle()
			.on('error', function (e) {
				gutil.log('Browserify Error', gutil.colors.red(e));
			})
			.pipe(source('main.js'))
			.pipe(gulp.dest('./styleguide/dist'));
	};
	return bundle();
});

var connect = require('gulp-connect');

gulp.task('connect:styleguide', function () {
	var port = opts.port || 8000;
	return connect.server({
		root: 'styleguide',
		port: port
	});
});

gulp.task('css:styleguide', function () {
	return gulp.src('styleguide/scss/*.scss')
		.pipe(sass())
		.pipe(prefix({cascade: true}))
		.pipe(gulp.dest('styleguide/dist'));
});

gulp.task('styleguide', ['styleguide-watching', 'js:styleguide', 'css:styleguide', 'connect:styleguide'], function () {
	var styles = paths.css.map(function (path) {
		return path.src + '**/*.scss';
	});
	styles.push('styleguide/scss/*.scss');
	gulp.watch(styles, ['css:styleguide']);
});


// deploy to github pages
var deploy = require('gulp-gh-pages');

gulp.task('deploy:styleguide', ['js:styleguide', 'css:styleguide'], function () {
	var options = Object.assign({cacheDir: 'styleguide/.tmp'}, require('./styleguide/deploy.json').options);
	return gulp.src(['styleguide/index.html', 'styleguide/dist/**/*', 'styleguide/lib/**/*'], {base: 'styleguide'})
		.pipe(deploy(options));
});
