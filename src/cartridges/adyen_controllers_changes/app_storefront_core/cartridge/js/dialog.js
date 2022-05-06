'use strict';

var ajax = require('./ajax'),
    util = require('./util'),
    _ = require('lodash'),
    imagesLoaded = require('imagesloaded');

var dialog = {
    /**
     * @function
     * @description Appends a dialog to a given container (target)
     * @param {Object} params  params.target can be an id selector or an jquery object
     */
    create: function (params) {
        var $target, id;

        if (_.isString(params.target)) {
            if (params.target.charAt(0) === '#') {
                $target = $(params.target);
            } else {
                $target = $('#' + params.target);
            }
        } else if (params.target instanceof jQuery) {
            $target = params.target;
        } else {
            $target = $('#dialog-container');
        }

        // if no element found, create one
        if ($target.length === 0) {
            if ($target.selector && $target.selector.charAt(0) === '#') {
                id = $target.selector.substr(1);
                $target = $('<div>').attr('id', id).addClass('dialog-content').appendTo('body');
            }
        }

        // create the dialog
        this.$container = $target;
        this.$container.dialog(_.merge({}, this.settings, params.options || {}));
    },
    /**
     * @function
     * @description Opens a dialog using the given url (params.url) or html (params.html)
     * @param {Object} params
     * @param {Object} params.url should contain the url
     * @param {String} params.html contains the html of the dialog content
     */
    open: function (params) {
        // close any open dialog
        this.close();
        this.create(params);
        this.replace(params);
    },
    /**
     * @description populate the dialog with html content, then open it
     **/
    openWithContent: function (params) {
        var content, position, callback;

        if (!this.$container) { return; }
        content = params.content || params.html;
        if (!content) { return; }
        this.$container.empty().html(content);
        if (!this.$container.dialog('isOpen')) {
            this.$container.dialog('open');
        }

        if (params.options) {
            position = params.options.position;
        }
        if (!position) {
            position = this.settings.position;
        }
        imagesLoaded(this.$container).on('done', function () {
            this.$container.dialog('option', 'position', position);
        }.bind(this));

        callback = (typeof params.callback === 'function') ? params.callback : function () {};
        callback();
    },
    /**
     * @description Replace the content of current dialog
     * @param {object} params
     * @param {string} params.url - If the url property is provided, an ajax call is performed to get the content to replace
     * @param {string} params.html - If no url property is provided, use html provided to replace
     */
    replace: function (params) {
        if (!this.$container) {
            return;
        }
        if (params.url) {
            params.url = util.appendParamToURL(params.url, 'format', 'ajax');
            ajax.load({
                url: params.url,
                data: params.data,
                callback: function (response) {
                    params.content = response;
                    this.openWithContent(params);
                }.bind(this)
            });
        } else if (params.html) {
            this.openWithContent(params);
        }
    },
    /**
     * @function
     * @description Closes the dialog
     */
    close: function () {
        if (!this.$container) {
            return;
        }
        this.$container.dialog('close');
    },
    exists: function () {
        return this.$container && (this.$container.length > 0);
    },
    isActive: function () {
        return this.exists() && (this.$container.children.length > 0);
    },
    settings: {
        autoOpen: false,
        height: 'auto',
        modal: true,
        overlay: {
            opacity: 0.5,
            background: 'black'
        },
        resizable: false,
        title: '',
        width: '800',
        close: function () {
            $(this).dialog('close');
        },
        position: {
            my: 'center',
            at: 'center',
            of: window,
            collision: 'flipfit'
        }
    }
};

module.exports = dialog;
