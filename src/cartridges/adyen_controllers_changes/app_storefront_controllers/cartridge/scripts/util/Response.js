'use strict';

/**
 * This module provides often-needed helper methods for sending responses.
 *
 * @module util/Response
 */

/**
 * Transforms the provided object into JSON format and sends it as JSON response to the client.
 */
exports.renderJSON = function (object) {
    response.setContentType('application/json');

    let json = JSON.stringify(object);
    response.writer.print(json);
};

/**
 * Sets the content type on the response and presents the string parameter as a downloadable file
 */
exports.renderData = function (string, fileName) {
    response.setHttpHeader(response.CONTENT_DISPOSITION, 'attachment; filename="' + fileName + '"');
    response.setContentType('application/octet-stream');
    response.writer.print(string);
};
