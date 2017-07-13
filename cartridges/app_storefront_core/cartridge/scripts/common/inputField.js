'use strict';

var ContentMgr = require('dw/content/ContentMgr');
var StringUtils = require('dw/util/StringUtils');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

var inputElements = [
	'input',
	'select',
	'textarea',
	'radio'
];
var inputElementTypes = [
	'text',
	'password',
	'checkbox',
	'hidden',
	'number',
	'range',
	'date',
	'datetime',
	'time',
	'datetime-local',
	'month',
	'week',
	'email',
	'url',
	'tel',
	'color',
	'search'
];

/**
 * @description Parse inputfield custom element
 * @param {dw.system.PipelineDictionary} pdict
 * @param {dw.web.FormField} pdict.formfield
 * @param {Boolean} pdict.formfield.mandatory - indicate whether the field is mandatory
 * @param {Boolean} pdict.required - override pdict.formfield.mandatory
 * @param {String} pdict.type - type of input element, such as `input`, `textarea`, `select`. It could also be input element's types, such as `checkbox`, `email`, `date` etc.
 * @param {Boolean} pdict.dynamicname - whether to use a defined `htmlName` or `dynamicHtmlName`
 * @param {Object} pdict.attributes - key/value pairs of custom attributes, for eg. {"data-greeting": "hello world"}
 * @param {Object} pdict.help - help text for the input field
 * @param {Object | String} pdict.help.label - the label of the help text. If it is an object, it should have `property` and `file` keys to look up the text from a resource bundle.
 * @param {String} pdict.help.cid - the id of the content asset that contains the help content
 * @return {Object} input object that contains `element`, `rowClass`, `label`, `input`, `caption`
 */
module.exports = function (pdict) {
	var input = '';
	var attributes = '';
	var label = '';
	var type = pdict.type;
	var value = StringUtils.stringToHtml(pdict.formfield.htmlValue) || '';
	var help = '';
	var fieldClass = '';
	var labelAfter = false;
	var required = pdict.formfield.mandatory;
	var element, name, id, rowClass, caption;

	// default type is 'text' for 'input' element
	if (type === 'input') {
		element = type;
		type = 'text';
	// if a specific input type is specified, use that
	} else if (inputElementTypes.indexOf(type) !== -1) {
		element = 'input';
	} else {
		element = type;
	}

	// if using an input not supported, bail early
	if (inputElements.indexOf(element) === -1) {
		return;
	}

	// custom attributes
	if (pdict.attributes) {
		Object.keys(pdict.attributes).forEach(function (key) {
			attributes += key + '="' + pdict.attributes[key] + '" ';
		});
	}

	// name
	name = pdict.dynamicname ? pdict.formfield.dynamicHtmlName : pdict.formfield.htmlName;
	id = name; // for client side validation, id should be same to avoid confusion in case of equalTo rule

	rowClass = pdict.rowclass ? pdict.rowclass : '';

	/*
	 if it is a phone, country field then add these as css class names as well
	 so that client side validation can work
	 please note this is kind of hack (to hard code ids) to avoid mass changes in the templates wherever phone/country is used
	*/
	if (pdict.formfield.formId === 'phone' || pdict.formfield.formId === 'country') {
		fieldClass += pdict.formfield.formId;
	}

	// required
	// pdict.required override pdict.formfield.mandatory
	if (pdict.required !== undefined && pdict.required !== null) {
		required = pdict.required;
	}
	if (required) {
		fieldClass += ' required';
		rowClass += ' required';
	}

	// validation
	if (!pdict.formfield.valid) {
		rowClass += ' error';
	}

	// label
	label = '<label for="' + name + '">';
	if (required) {
		label += '<span class="required-indicator">&#8226; </span>';
	}
	label += '<span>' + Resource.msg(pdict.formfield.label, 'forms', null) + '</span>';
	label += '</label>';

	var options = [];
	// input
	switch (element) {
		case 'select':
			input = '<select class="input-select ' + fieldClass + '" id="' + id + '" name="' + name + '" ' + attributes + '>';
			// interate over pdict.formfield.options, append to the options array
			Object.keys(pdict.formfield.options).forEach(function (optionKey) {
				var option = pdict.formfield.options[optionKey];
				// avoid empty option tags, because this causes an XHTML warning
				var label = Resource.msg(option.label, 'forms', null);
				var value = option.value || '';
				var displayValue = label;
				var selected = option.selected ? 'selected="selected"' : '';

				if (!displayValue) {
					displayValue = '<!-- Empty -->';
				} else {
					// encode it already, because in case of empty, we want to avoid encoding
					displayValue = StringUtils.stringToHtml(displayValue);
				}

				options.push('<option class="select-option" label="' + label + '" value="' + value + '" ' + selected + '>' + displayValue + '</option>');
			});
			input += options.join('');
			input += '</select>';
			break;
		case 'input':
			var checked = '';
			var inputClass = 'input-text';
			if (type === 'checkbox') {
				rowClass += ' label-inline form-indent';
				labelAfter = true;
				inputClass = 'input-checkbox';
				if (pdict.formfield.checked) {
					checked = 'checked="checked"';
				}
			}
			if (type === 'hidden') {
				inputClass = '';
			}

			input = '<input class="' + inputClass + ' ' + fieldClass + '" type="' + type + '" ' + checked + ' id="' + id + '" name="' + name + '" value="' + value + '" ' + attributes + '/>';
			break;
		case 'textarea':
			input = '<textarea class="input-textarea ' + fieldClass + '" id="' + id + '" name="' + name + '" ' + attributes + '>';
			input += value;
			input += '</textarea>';
			break;
		// treat radio as its own element, as each option is an input element
		case 'radio':
			Object.keys(pdict.formfield.options).forEach(function (optionKey) {
				var option = pdict.formfield.options[optionKey];
				var value = option.value;
				var checked = '';
				if (option.checked) {
					checked = 'checked="checked"';
				}
				options.push('<input class="input-radio "' + fieldClass + ' type="radio"' + checked + ' id="' + id + '" name="' + name + '" value="' + value + '" ' + attributes + '/>' + Resource.msg(option.label, 'forms', null));
			});
			input += options.join('');
			break;
	}

	// caption - error message or description
	var hasError = !!pdict.formfield.error;
	var message = '';
	if (hasError) {
		message = Resource.msg(pdict.formfield.error, 'forms', null);
	} else if (pdict.formfield.description) {
		message = Resource.msg(pdict.formfield.description, 'forms', null);
	}
	caption = '<div class="form-caption' + (hasError ? ' error-message' : '') + '">' + message + '</div>';

	// help text
	var helplabel = '';
	var helpcontent = '';
	var helpAsset;
	if (pdict.help) {
		if (typeof pdict.help.label === 'string') {
			helplabel = pdict.help.label;
		} else if (typeof pdict.help.label === 'object') {
			if (pdict.help.label.property && pdict.help.label.file) {
				helplabel = Resource.msg(pdict.help.label.property, pdict.help.label.file, null);
			}
		}
		helpAsset = ContentMgr.getContent(pdict.help.cid);
		if (helpAsset) {
			helpcontent = helpAsset.custom.body;
		}
		help = [
			'<div class="form-field-tooltip">',
			'<a href="' + URLUtils.url('Page-Show', 'cid', pdict.help.cid) + '" class="tooltip">',
			helplabel,
			'<div class="tooltip-content" data-layout="small">',
			helpcontent,
			'</div>',
			'</a>',
			'</div>'
		].join('');
	}

	return {
		rowClass: rowClass,
		label: label,
		input: input,
		caption: caption,
		help: help,
		labelAfter: labelAfter
	};
};
