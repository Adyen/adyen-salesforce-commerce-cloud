'use strict';

/**
 * @function
 * @description Initializes the tooltip-content and layout
 */
exports.init = function () {
    $(document).tooltip({
        items: '.tooltip',
        track: true,
        content: function () {
            return $(this).find('.tooltip-content').html();
        }
    });

    $('.share-link').on('click', function (e) {
        e.preventDefault();
        var target = $(this).data('target');
        if (!target) {
            return;
        }
        $(target).toggleClass('active');
    });
};
