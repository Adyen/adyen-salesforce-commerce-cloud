'use strict';

/**
 * copied from https://github.com/darkskyapp/string-hash
 */
function hashFn(str) {
    var hash = 5381,
        i = str.length;

    while (i) {
        hash = (hash * 33) ^ str.charCodeAt(--i);
    }
    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
    * integers. Since we want the results to be always positive, convert the
    * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;
}

/**
 * Create rating based on hash ranging from 2-5
 * @param pid
 */
function getRating(pid) {
    return hashFn(pid.toString()) % 30 / 10 + 2;
}

module.exports = {
    init: function () {
        $('.product-review').each(function (index, review) {
            var pid = $(review).data('pid');
            if (!pid) {
                return;
            }
            // rating range from 2 - 5
            var rating = getRating(pid);
            var baseRating = Math.floor(rating);
            var starsCount = 0;
            for (var i = 0; i < baseRating; i++) {
                $('.rating', review).append('<i class="fa fa-star"></i>');
                starsCount++;
            }
            // give half star for anything in between
            if (rating > baseRating) {
                $('.rating', review).append('<i class="fa fa-star-half-o"></i>');
                starsCount++;
            }
            if (starsCount < 5) {
                for (var j = 0; j < 5 - starsCount; j++) {
                    $('.rating', review).append('<i class="fa fa-star-o"></i>');
                }
            }
        });
    }
};
