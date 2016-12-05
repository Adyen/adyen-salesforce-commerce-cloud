# Welcome to the SiteGenesis Repository

Please note that `master` is under active development, so please use with caution.
Check out our tagged versions if you'd like more stable, tested releases.  We recommend starting any new project based off the latest [tag](https://bitbucket.org/demandware/sitegenesis#tags), and never from the HEAD of the `master` branch!

# Purpose

The goals of this repository are:

* To provide earlier access to Demandware developers as platform releases are pushed to the sandboxes
* To provide 'git' access to the code so that you can cherry pick specific fixes (or even merge entire releases!) into your code lines
* To provide the community a vehicle for submitting code changes via git's 'pull request' mechanism
* To allow community members to share (un-tested) code branches with each other.

License and Attribution Guide is available at https://xchange.demandware.com/docs/DOC-29638.

Important installation note: if you merely import the code for this site without importing the data, you will most likely see a "broken" footer.  The 15.4 footer uses some new content assets.  We recommend exporting your current site, importing the site data from the `demo_data_no_hires_images` directory and then re-import your custom data.

A detailed submission guideline is posted on XChange (https://xchange.demandware.com/docs/DOC-21927).

Thank you for your submissions and your thoughts on the best way to utilize this resource.

# Shared Content Site
One of the new features as of SiteGenesis 14.8 is the ability to demonstrate the use of the Shared Content facility built into Demandware.  To enable this capability, the content library in Site Genesis has been rebuilt as a "shared library".  In order to demonstrate the power of this feature, we have created a new site which shares this library with Site Genesis.  The new site, called "SiteGenesisCollections".  You can download the cartrdige which contains this new site from https://bitbucket.org/demandware/sitegenesis-content-sharing


# Test Automation

Please read the README.md file in the test directory, but essentially, we have a series of application and unit tests that are runnable from the commandline using either 'grunt' or 'gulp'.  The README.md in the test directory will guide in installing and running the tools that you need for executing these tests.

Please note: the tests that we are offering is not a complete, fixed set of tests.  This is a living directory which we will continue to add to as our team is able.  We also encourage any reader of this document to use these tests as a model and to enhance this capability by adding their own tests.

# How to Use
## Build tools
Starting with 15.1, SiteGenesis supports both [gulp](http://gulpjs.com) and [Grunt](http://gruntjs.com) as build tools.

### Getting started
- Pull down the latest copy of SiteGenesis. If you're reading this doc, it is likely that you already have a version of SG with the build tool config.
- `cd` into the `sitegenesis` directory.
- Install node modules:
```sh
$ npm install
```
This assumes that you already have `npm` installed on your command line. If not, please [install node](http://nodejs.org/download/) first.
If you encounter an error, please try and address that first, either by Googling or [contacting us](mailto:tnguyen@demandware.com).
- Install either `gulp` or `grunt` (see below).

#### gulp
Install gulp globally
```sh
$ npm install -g gulp
```

#### grunt
Install the grunt command line tools
```sh
$ npm install -g grunt-cli
```

Now that you have gulp (or grunt) and its dependencies installed, you can start using it in your workflow.


### SCSS
Before authoring SCSS, make sure to check out the README in the `app_storefront_core/cartridge/scss` directory.

#### `gulp css`
This task does 2 things:
- Compile `.scss` code into `.css`
- [Auto-prefix](https://github.com/ai/autoprefixer) for vendor prefixes

This task is also run automatically on any `.scss` file change by using the `gulp watch` task.

The equivalent task for grunt, `grunt css`, is also available.

### JS
Before authoring JS, make sure to checkout the README in `app_storefront_core/cartridge/js` directory.

The new modular JavaScript architecture relies on [browserify](https://github.com/substack/node-browserify) to compile JS code written in CommonJS standard.

#### `gulp js`

Compile JS modules in the `js` directory into `static/default/js` directory. The entry point for browserify is `app_storefront_core/cartridge/js/app.js`, and the bundled js is output to `app_storefront_core/cartridge/static/default/js/app.js`.

This task is also run automatically on any `.js` file change by using the `gulp watch` task.

The equivalent task for grunt, `grunt js`, is also available.

#### `gulp jscs` and `gulp jshint`
Run code format and style validators. New code must not have any errors reported before being accepted.

The equivalent tasks for grunt, `grunt jscs` and `grunt jshint`, are also available.

### Watching
To make the development process easier, running `gulp` on the command line will run the default task and automatically watch any changes in both `scss` and `js` code to run the right compilers.

For JavaScript, when watching is happening, [watchify](https://github.com/substack/watchify) is used instead of browserify for faster bundling by taking advantage of caching.

The equivalent default task for grunt, `grunt`, is also available.

### Sourcemaps
For sourcemaps support, run `gulp` or `grunt` in development mode by specificying `type` flag, i.e. `:; gulp --sourcemaps`.

We only support external sourcemaps because Eclipse tend to crash with inline sourcemaps.
As a result, if you're using Grunt, sourcemaps is only available when the build steps are run explicitly, i.e. `grunt js --sourcemaps`. Sourcemaps is not enabled during `watch` mode.
