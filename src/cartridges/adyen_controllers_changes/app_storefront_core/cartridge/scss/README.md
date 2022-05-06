# SASS Guide
This is a port of SiteGenesis's old CSS architecture to using SASS.

### Authoring
All stylesheets are now written in SCSS, whose syntax is a superset of CSS. This means that any existing CSS is valid SCSS.

SCSS authoring is meant to be used with a build tool, which is currently [gulp](http://gulpjs.com).
Once compiled, the SCSS is output as CSS in `static/default/css` folder just like before. See the contributing guide (`CONTRIBUTING.md`) for more information.

### Eclipse
To edit `.scss` files in Eclipse, install the [Aptana Studio Eclispe Plug-in](http://www.aptana.com/products/studio3/download) version.

## Code styles
Inspired by <https://github.com/twbs/bootstrap/blob/master/CONTRIBUTING.md#css> and <http://css-tricks.com/sass-style-guide/>

- Include partials should be prefixed with `_`, i.e. `_partial.scss`
- Multiple-line approach (one property and value per line).
```scss
// OK
a {
	color: $green;
	text-decoration: underline;
}
// Bad
a {color: $green; text-decoration: underline;}
```
- Use ONE space after a property's colon.
```scss
// OK
.block {
	display: block;
}
// Bad
.block {
	display:block;
}
```
- End all lines with a semi-colon.
- For multiple, comma-separated selectors, place each selector on its own line.
```scss
// OK
.selectorA,
.selectorB {

}
// Bad
. selectorA, .selectorB {}
```
- No vendor prefixes. This will be done at build time using autoprefixer.
- Attribute selectors, like `input[type="text"]` should always wrap the attribute's value in double quotes, for consistency and safety.
- Maximum selector nesting: **three** levels deep.
- Global sass file (`style.scss`) is just a table of content.
- Avoid the use of ID (`#`) like a plague. Class naming is preferred.
- When using class or ID selector, drop the element selector.
```scss
// OK
.className {
}
// Bad
div.className{
}
```
- Use lowercase for HEX colors, i.e. `#eaea56` instead of `#EAEA56`.
- Contract HEX colors when possible, i.e. `#fff` instead of `#ffffff`.
- **!important** Avoid using `!important` at all cost!

## Variables
Variables are defined in the `_variables.scss` files.
For color variables, use <http://www.color-blindness.com/color-name-hue/> to find the color name.

```scss
// OK
$sangria: #990000;
// Bad
$red: #990000;
```
