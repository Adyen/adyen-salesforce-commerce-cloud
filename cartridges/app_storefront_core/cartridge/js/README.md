# JavaScript Guide

## Modularization
[CommonJS](http://wiki.commonjs.org/wiki/CommonJS) standard is used for client-side JavaScript modularization. The modules are then bundled into a single file using [Browserify](http://browserify.org/).

To use browserify, run `gulp js` on the command line. See `README.md` at the root level of the project.

## Authoring
All codes are written in [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode).

In order to enforce a consistent style, please use [editorconfig](http://editorconfig.org/) to set up your editors.

[eslint](http://eslint.org/) is used for style and format validation.
It can be run using the build tool, `npm run lint`. Grunt and gulp task equivalents are also available (`grunt lint` and `gulp lint`).

### Code styles

#### White spaces
- Hard tabs everywhere (this allows different developer to configure the amount of tab size to their liking).
- Use 1 space after keywords `if`, `for`, `while` etc.
- Use one space after function for anonymous functions but not for named functions:

```js
var a = function () {};
function a() {}
```
- Use a space before and a space after binary operators `+`, `=`, `&&` etc.

```js
if (a === '1') {
	a = a + '2';
}
```
For other more granular rules about spaces, see `.eslintrc.json`.

#### Variables
- Don't be overly descriptive with your variable names but don't abuse one-letter variables either. Find a sweet spot somewhere in between.
- For variables that refer to jQuery DOM elements, prefix it with `$`

```js
var $main = $('body');
var $form = $('.form');
```

#### Comments
- Use `//` for all comments.
- Comment everything that is not obvious.
- If you're adding a new check, write a comment describing why this check is important and what it checks for.

#### Misc
- Always use strict mode.
- Always use strict comparision, i.e. `===` and `!==`.
- Use semicolons.
- Don't use comma-first notation.

```js
// OK
var main = 'one',
	secondary = 'two',
	tertiary = 'three';
// Bad
var main = 'one'
	, secondary = 'two'
	, tertiary = 'three'
	;
```
- Always use curly braces, even for a single statement

```js
// OK
if (condition === true) { return true; }
// Bad
if (condition === false) return false;
```
- Use single quotes as much as possible. Use double quotes within single quote for quoting inside a string. This is especially relevant for jQuery selectors.

```js
var string = 'I prefer single quotes';
var quotes = 'I am a "quote" within a string';
var $navContainer = $('.container[name$="nav"]');
```
- Object keys shouldn't have quotes around them unless necessary.

```js
var obj = {
	one: 'One',
	't-w-o': 2
};
```
