'use strict';
// jQuery extensions

module.exports = function () {
    // params
    // toggleClass - required
    // triggerSelector - optional. the selector for the element that triggers the event handler. defaults to the child elements of the list.
    // eventName - optional. defaults to 'click'
    $.fn.toggledList = function (options) {
        if (!options.toggleClass) { return this; }
        var list = this;
        return list.on(options.eventName || 'click', options.triggerSelector || list.children(), function (e) {
            e.preventDefault();
            var classTarget = options.triggerSelector ? $(this).parent() : $(this);
            classTarget.toggleClass(options.toggleClass);
            // execute callback if exists
            if (options.callback) {options.callback();}
        });
    };

    $.fn.syncHeight = function () {
        var arr = $.makeArray(this);
        arr.sort(function (a, b) {
            return $(a).height() - $(b).height();
        });
        return this.height($(arr[arr.length - 1]).height());
    };
};
