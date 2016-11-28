'use strict';

const FormField = require('dw/web/FormField');
const FormGroup = require('dw/web/FormGroup');

/**
 * @description parse FormField element, create context and apply inputfield template to generate form field markup
 * @param {dw.web.FormField} field
 * @param {Object} fieldData extra data that contains context for the template
 * @return {String} HTML markup of the field
 */
function getFieldContext(field, fieldData) {
	const context = {};
	let type;

	/**
	 * Compile array of form definition attr values.  These will set the
	 * appropriate attrs in the rendered html to trigger form validation errors
	 * on the client, with the exception of the 'required' field which is set in
	 * countries.json
	 */
	const attrFields = {
		min: field.maxValue,
		max: field.minValue,
		minlength: field.minLength,
		maxlength: field.maxLength
	};

	switch (field.type) {
		case FormField.FIELD_TYPE_BOOLEAN:
			type = 'checkbox';
			break;
		case FormField.FIELD_TYPE_DATE:
			type = 'date';
			break;
		case FormField.FIELD_TYPE_INTEGER:
		case FormField.FIELD_TYPE_NUMBER:
			type = 'number';
			break;
		case FormField.FIELD_TYPE_STRING:
			type = 'text';
			break;
	}

	// Add attributes from form field definitions.  Note: These may be
	// overridden by the related fields in countries.json if specified.
	if (_anyAttrHasValue(attrFields)) {
		context.attributes = _getValuedAttrs(attrFields);
	}

	context.formfield = field;
	context.type = type;
	if (fieldData) {
		Object.keys(fieldData).forEach(function (prop) {
			context[prop] = fieldData[prop];
		});
	}

	return context;
}

/**
 * Cycles through each property of a provided object and returns True if any has
 * a value
 *
 * @param {Object} attrs - Map of form field attributes
 * @returns {Boolean}
 */
function _anyAttrHasValue (attrs) {
	var keys = Object.keys(attrs);
	var value;

	for(var i = 0; i < keys.length; i++) {
		value = attrs[keys[i]];
		if (value != null) {
			return true;
		}
	}

	return false;
}

/**
 * Get a map of form field attributes with their respective values
 *
 * @param {Object} attrs - Map of handled form field attributes
 * @returns {Object} - Filtered map of form field attributes with their values
 */
function _getValuedAttrs (attrs) {
	var attrProxy = {};

	Object.keys(attrs).forEach(function (attr) {
		var value = attrs[attr];

		if (value != null) {
			attrProxy[attr] = value;
		}
	});

	return attrProxy;
}

module.exports.getFields = function (formObject, formData) {
	var fields = [];
	for (var formElementName in formObject) {
		var formElement = formObject[formElementName];
		var fieldData;
		if (formData) {
			fieldData = formData[formElementName];
		}
		if (formElement instanceof FormField) {
			if (fieldData && fieldData.skip) {
				continue;
			}
			fields.push(getFieldContext(formElement, fieldData));
		} else if (formElement instanceof FormGroup) {
			if (fieldData && Array.isArray(fieldData)) {
				for (var i = 0; i < fieldData.length; i++) {
					var childField = fieldData[i];
					// in case of nested children, iterate through children selector separated by `.`
					var childFieldElement = formElement;
					var nestedChildren;
					if (childField.fieldName.indexOf('.') !== -1) {
						nestedChildren = childField.fieldName.split('.');
						for (var j = 0; j < nestedChildren.length; j++) {
							childFieldElement = childFieldElement[nestedChildren[j]];
						}
					} else {
						childFieldElement = formElement[childField.fieldName];
					}
					fields.push(getFieldContext(childFieldElement, childField));
				}
			}
		}
	}
	return fields;
};
