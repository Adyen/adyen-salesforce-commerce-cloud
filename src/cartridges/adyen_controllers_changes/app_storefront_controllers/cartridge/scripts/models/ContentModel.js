'use strict';

/**
* Model for managing content assets.
 * @module models/ContentModel
 */

var AbstractModel = require('./AbstractModel');

/**
 * Content helper providing enhanced content functionality
 * @class module:models/ContentModel~ContentModel
 *
 * @extends module:models/AbstractModel
 */
var ContentModel = AbstractModel.extend(
    /** @lends module:models/ContentModel~ContentModel.prototype */
    {
        /**
         *  Get navigation link from custom attribute "pipelineLink"
         *  or creating new link of content page for current asset.
         *
         * @alias module:models/ContentModel~ContentModel/getLink
         * @returns {String} URL to page rendered by the page.ds controller Show function for the current content asset.
         */
        getLink: function () {
            if (!this.object) {
                return null;
            }

            return dw.web.URLUtils.url('Page-Show', 'cid', this.object.ID);
        },

        /**
        * Checks whether current content asset is in the specified folder.
        *
        * @alias module:models/ContentModel~ContentModel/isInFolder
        * @param {String} folderId - The folder id.
        * @returns {Boolean} true if current content asset is in the specified folder.
        */
        isInFolder: function (folderId) {
            if (this.object && !empty(this.object.folders)) {
                for (let index in this.object.folders) {
                    if (this.object.folders[index].ID === folderId) {
                        return true;
                    }
                }
            }
            return false;
        },

        /**
         * Returns actual markup of the content asset if it is defined, otherwise returns an empty string.
         * @alias module:models/ContentModel~ContentModel/getMarkup
         * @returns {String} b
         */
        getMarkup: function () {
            var body = this.getValue('body');
            return body && body.markup || '';
        },

        /**
         * Returns the default folder. This is either the classification folder or the first folder the asset is
         * assigned to.
         *
         * @alias module:models/ContentModel~ContentModel/getDefaultFolder
         * @return {dw.content.Folder} The default folder for this asset
         */
        getDefaultFolder: function () {
            var folder = null;
            if (this.object) {
                folder = this.object.classificationFolder;
                if (!folder && !this.object.folders.empty) {
                    folder = this.object.folders[0];
                }
            }
            return folder;
        },

        /**
         * Returns an array containing the folder path of the default folder.
         * @alias module:models/ContentModel~ContentModel/getFolderPath
         * @return {Array} The fodler path for this asset
         */
        getFolderPath: function () {
            var path = [];
            if (this.object) {
                var folder = this.getDefaultFolder();
                if (folder) {
                    while (folder.ID !== 'root') {
                        path.unshift(folder);
                        folder = folder.parent;
                    }
                }
            }
            return path;
        }

    });

/**
 * Gets a new instance for a given content asset,
 * if that content asset is online.
 *
 * @alias module:models/ContentModel~ContentModel/get
 * @param parameter {(dw.content.Content|String)} The content object to enhance/wrap or the content ID of the content object.
 * @returns {module:models/ContentModel~ContentModel}
 */
ContentModel.get = function (parameter) {
    var obj = null;
    if (typeof parameter === 'string') {
        obj = dw.content.ContentMgr.getContent(parameter);
        if (obj && !obj.online){
            obj = null;
        }
    } else if (typeof parameter === 'object') {
        obj = parameter;
    }
    return (obj !== null) ? new ContentModel(obj) : null;
};

/** The content class */
module.exports = ContentModel;
