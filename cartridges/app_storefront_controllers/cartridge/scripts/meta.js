'use strict';
/**
 * @module meta
 */

var HOME_BREADCRUMB = {
    name: dw.web.Resource.msg('global.home', 'locale', null),
    url: dw.web.URLUtils.httpHome()
};

/**
 * Constructor for metadata singleton
 *
 * This should be initialized via the current context object (product, category, asset or folder) and can
 * be used to retrieve the page metadata, breadcrumbs and to render the accumulated information to the client
 *
 * @class
 */
var Meta = function () {
    this.data = {
        page: {
            title: '',
            description: '',
            keywords: ''
        },
        // supports elements with properties name and url
        breadcrumbs: [HOME_BREADCRUMB],
        resources: {}
    };
};

Meta.prototype = {
    /**
     * The core method of this class which updates the internal data represenation with the given information
     *
     * @param  {Object|dw.catalog.Product|dw.catalog.Category|dw.content.Content|dw.content.Folder} object The object to update with
     *
     * @example
     * // using a product object
     * meta.update(product);
     * // using a plain object
     * meta.update({resources: {
     *     'MY_RESOURCE': dw.web.Resource.msg('my.resource', 'mybundle', null)
     * }});
     * // using a string
     * meta.update('account.landing')
     */
    update: function (object) {
        // if object is null, then don't try to update it
        if (object === null) {
            return;
        }

        // check if object wrapped in AbstractModel and get system object if so get the system object
        if ('object' in object) {
            object = object.object;
        }
        // check if it is a system object
        if (object.class) {
            // update metadata
            var title = null;
            if ('pageTitle' in object) {
                title = object.pageTitle;
            }
            if (!title && 'name' in object) {
                title = object.name;
            } else if (!title && 'displayName' in object) {
                title = object.displayName;
            }
            this.data.page.title = title;
            if ('pageKeywords' in object && object.pageKeywords) {
                this.data.page.keywords = object.pageKeywords;
            }
            if ('pageDescription' in object && object.pageDescription) {
                this.data.page.description = object.pageDescription;
            }

            // Update breadcrumbs for content
            if (object.class === dw.content.Content) {
                var path = require('~/cartridge/scripts/models/ContentModel').get(object).getFolderPath();
                this.data.breadcrumbs = path.map(function (folder) {
                    return {
                        name: folder.displayName
                    };
                });
                this.data.breadcrumbs.unshift(HOME_BREADCRUMB);
                this.data.breadcrumbs.push({
                    name: object.name,
                    url: dw.web.URLUtils.url('Page-Show', 'cid', object.ID)
                });
                dw.system.Logger.debug('Content breadcrumbs calculated: ' + JSON.stringify(this.data.breadcrumbs));
            }
        } else if (typeof object === 'string') {
            // @TODO Should ideally allow to pass something like account.overview, account.wishlist etc.
            // and at least generate the breadcrumbs & page title
        } else {
            if (object.pageTitle) {
                this.data.page.title = object.pageTitle;
            }
            if (object.pageKeywords) {
                this.data.page.keywords = object.pageKeywords;
            }
            if (object.pageDescription) {
                this.data.page.description = object.pageDescription;
            }
            // @TODO do an _.extend(this.data, object) of the passed object
        }
        this.updatePageMetaData();
    },
    /**
     * Update the Page Metadata with the current internal data
     */
    updatePageMetaData: function () {
        var pageMetaData = request.pageMetaData;
        pageMetaData.title = this.data.page.title;
        pageMetaData.keywords = this.data.page.keywords;
        pageMetaData.description = this.data.page.description;
    },
    /**
     * Get the breadcrumbs for the current page
     *
     * @return {Array} an array containing the breadcrumb items
     */
    getBreadcrumbs: function () {
        return this.data.breadcrumbs || [];
    },
    /**
     * Adds a resource key to meta, the key of the given bundle is simply dumped to a data
     * attribute and can be consumed by the client.
     *
     * @example
     * // on the server
     * require('meta').addResource('some.message.key', 'bundlename');
     * // on the client
     * console.log(app.resources['some.message.key']);
     *
     * @param {string} key          The resource key
     * @param {string} bundle       The bundle name
     * @param {string} defaultValue Optional default value, empty string otherwise
     */
    addResource: function (key, bundle, defaultValue) {
        this.data.resources[key] = dw.web.Resource.msg(key, bundle, defaultValue || '');
    },
    /**
     * Dumps the internally held data into teh DOM
     *
     * @return {String} A div with a data attribute containing all data as JSON
     */
    renderClientData: function () {
        return '<div class="page-context" data-dw-context="' + JSON.stringify(this.data) + '" />';
    }
};

/**
 * Singleton instance for meta data handling
 * @type {module:meta~Meta}
 */
module.exports = new Meta();
