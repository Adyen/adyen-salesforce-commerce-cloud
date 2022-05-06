'use strict';

/**
 * @description Creates product recommendation carousel using jQuery jcarousel plugin
 **/
module.exports = function () {
    var $carousel = $('#carousel-recommendations');
    if (!$carousel || $carousel.length === 0 || $carousel.children().length === 0) {
        return;
    }
    $carousel.jcarousel();
    $('#carousel-recommendations .jcarousel-prev')
        .on('jcarouselcontrol:active', function () {
            $(this).removeClass('inactive');
        })
        .on('jcarouselcontrol:inactive', function () {
            $(this).addClass('inactive');
        })
        .jcarouselControl({
            target: '-=1'
        });

    $('#carousel-recommendations .jcarousel-next')
        .on('jcarouselcontrol:active', function () {
            $(this).removeClass('inactive');
        })
        .on('jcarouselcontrol:inactive', function () {
            $(this).addClass('inactive');
        })
        .jcarouselControl({
            target: '+=1'
        });
};
