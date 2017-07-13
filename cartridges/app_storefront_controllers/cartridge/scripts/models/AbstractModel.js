'use strict';

/**
 * Model for prototype model functionality.
 * @module models/AbstractModel
 */

/* API Includes */
var Class = require('~/cartridge/scripts/util/Class').Class;
var Logger = require('dw/system/Logger');

var AbstractModel = Class.extend({
    /**
     * Property holding the wrapped object that is initialized in the child classes. Usually,
     * the static get() method of the app.js module is used to obtain a model instance.
     */
    object: null,

    /**
     * Abstract class for all modules implementing the {@tutorial Models} concept. Models typlcally wrap
     * {@link dw.object.PersistenObject} instances or more general instances of Salesforce Commerce Cloud API classes.
     *
     * @extends module:util/Class~Class
     * @constructs module:models/AbstractModel~AbstractModel
     * @param obj {Object}
     * @see https://bitbucket.org/demandware/sitegenesis-community/wiki/Home
     */
    init: function (obj) {
        if (!obj) {
            throw new Error('Wrapped object may not be null.');
        }

        this.object = obj;
        // Optionally, intializes properties. Be careful of the potential performance impact,
        // which is why it is preferable to do this only for subclasses that really need it
        //this.initProperties();
        return this;
    },

    /**
     * Returns a wrapped object instance. This method needs to be implemented by the subclasses.
     *
     * @abstract
     * @alias module:models/AbstractModel~AbstractModel/get
     * @return {Void}
     */
    get: function () {
        Logger.warn('Generic helper access method "get()" not implemented for subclass');
        return new AbstractModel({custom: {}});
    },

    /**
     * Gets value from prepopulated object.
     * If the key is point-delimited, parses JSON
     * If not, obtains a value from "custom" property of an object
     * @alias module:models/AbstractModel~AbstractModel/getValue
     * @param {String} key The JSON key to retrieve a value for.
     * @return {Object}
     */
    getValue: function (key) {
        if (empty(key)) {
            return null;
        }

        // Adds any special value handling here, such as automatic handling of JSON.
        var value = this.object.custom[key];

        return value;
    },

    /**
     * Sets value to prepopulated object.
     * If the key is point-delimited, parses JSON and sets up a target value.
     * @alias module:models/AbstractModel~AbstractModel/setValue.
     * @return {Boolean} true if value is successfully set.
     */
    setValue: function (key, value) {
        // this will works under transactional nodes
        if (!this.object || empty(key)) {
            return false;
        }

        try {
            this.object.custom[key] = value;
        } catch (e) {
            return false;
        }
    },

    /**
     * Creates property access and delegate it to the appropriate getters & setters of the wrapper or wrapped object
     * @alias module:models/AbstractModel~AbstractModel/initProperties
     */
    initProperties: function () {
        var instance = this;
        // properties.forEach(function(property) {
        //     instance.__defineGetter__(
        //         property,
        //         function(){
        //           return instance.object[property];
        //         }
        //     );
        // });
        var duration = new Date().getTime();
        var properties = [];
        for (var property in instance.object) {
            properties.push(property);
        }
        properties.forEach(function (property) {
            var propertyName;
            if (property.indexOf('get') === 0) {
                // remove get and lowercase first character, i.e. getOnline -> online
                propertyName = property.substring(3,4).toLowerCase() + property.substring(4);
                // only define if there is a corresponding property as well
                if (properties.indexOf(propertyName) > -1) {
                    //Logger.debug('Defining property get access for {0}',propertyName);
                    instance.__defineGetter__(
                        propertyName,
                        (property in instance) ? function () {return instance[property]();} : function () {return instance.object[propertyName];}
                    );
                }
            }
            // handle setters
            if (property.indexOf('set') === 0) {
                // remove get and lowercase first character, i.e. getOnline -> online
                propertyName = property.substring(3,4).toLowerCase() + property.substring(4);
                // only define if there is a corresponding property as well
                if (properties.indexOf(propertyName) > -1) {
                    //Logger.debug('Defining property set access for {0}',propertyName);
                    instance.__defineSetter__(
                        propertyName,
                        (property in instance) ? function (v) {return instance[property](v);} : function (v) {return instance.object[property](v);}
                    );
                }
            }
        });
        duration = new Date().getTime() - duration;
        Logger.info('{0}ms to define property access',duration);
    },

    /**
     * Fallback to use wrapped object's native functions in case method is not defined.
     * The logic will try to invoke method for this.object, and throw TypeError if the method does not exist
     *
     * @param {String} methodName The name of a method to use as a fallback.
     * @param {Array} methodArgs The arguments for the method.
     *
     * @alias module:models/AbstractModel~AbstractModel/__noSuchMethod__
     * @return Record Result or exception if the method does not exist.
     * @throws {TypeError}
     */
    __noSuchMethod__: function (methodName, methodArgs) {
        if (methodName in this.object && 'function' === typeof this.object[methodName]) {
            return this.object[methodName].apply(this.object, methodArgs);
        }
        // If the method cannot be found.
        Logger.error('Method "{0}" does not exist for {1}',methodName,this.object.class);
        throw new TypeError();
    }
});

/** The AbstractModel class */
module.exports = AbstractModel;
