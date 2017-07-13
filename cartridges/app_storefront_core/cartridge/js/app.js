/**
 *    (c) 2009-2014 Demandware Inc.
 *    Subject to standard usage terms and conditions
 *    For all details and documentation:
 *    https://bitbucket.com/demandware/sitegenesis
 */

'use strict';

var countries = require('./countries'),
    dialog = require('./dialog'),
    minicart = require('./minicart'),
    page = require('./page'),
    rating = require('./rating'),
    searchplaceholder = require('./searchplaceholder'),
    searchsuggest = require('./searchsuggest'),
    tooltip = require('./tooltip'),
    util = require('./util'),
    validator = require('./validator'),
    tls = require('./tls');

// if jQuery has not been loaded, load from google cdn
if (!window.jQuery) {
    var s = document.createElement('script');
    s.setAttribute('src', 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js');
    s.setAttribute('type', 'text/javascript');
    document.getElementsByTagName('head')[0].appendChild(s);
}

require('./jquery-ext')();
require('./cookieprivacy')();
require('./captcha')();

function initializeEvents() {
    var controlKeys = ['8', '13', '46', '45', '36', '35', '38', '37', '40', '39'];

    $('body')
        .on('keydown', 'textarea[data-character-limit]', function (e) {
            var text = $.trim($(this).val()),
                charsLimit = $(this).data('character-limit'),
                charsUsed = text.length;

            if ((charsUsed >= charsLimit) && (controlKeys.indexOf(e.which.toString()) < 0)) {
                e.preventDefault();
            }
        })
        .on('change keyup mouseup', 'textarea[data-character-limit]', function () {
            var text = $.trim($(this).val()),
                charsLimit = $(this).data('character-limit'),
                charsUsed = text.length,
                charsRemain = charsLimit - charsUsed;

            if (charsRemain < 0) {
                $(this).val(text.slice(0, charsRemain));
                charsRemain = 0;
            }

            $(this).next('div.char-count').find('.char-remain-count').html(charsRemain);
        });

    /**
     * initialize search suggestions, pending the value of the site preference(enhancedSearchSuggestions)
     * this will either init the legacy(false) or the beta versions(true) of the the search suggest feature.
     * */
    var $searchContainer = $('#navigation .header-search');
    searchsuggest.init($searchContainer, Resources.SIMPLE_SEARCH);

    // add show/hide navigation elements
    $('.secondary-navigation .toggle').click(function () {
        $(this).toggleClass('expanded').next('ul').toggle();
    });

    // add generic toggle functionality
    $('.toggle').next('.toggle-content').hide();
    $('.toggle').click(function () {
        $(this).toggleClass('expanded').next('.toggle-content').toggle();
    });

    // subscribe email box
    var $subscribeEmail = $('.subscribe-email');
    if ($subscribeEmail.length > 0)    {
        $subscribeEmail.focus(function () {
            var val = $(this.val());
            if (val.length > 0 && val !== Resources.SUBSCRIBE_EMAIL_DEFAULT) {
                return; // do not animate when contains non-default value
            }

            $(this).animate({color: '#999999'}, 500, 'linear', function () {
                $(this).val('').css('color', '#333333');
            });
        }).blur(function () {
            var val = $.trim($(this.val()));
            if (val.length > 0) {
                return; // do not animate when contains value
            }
            $(this).val(Resources.SUBSCRIBE_EMAIL_DEFAULT)
                .css('color', '#999999')
                .animate({color: '#333333'}, 500, 'linear');
        });
    }

    $('.privacy-policy').on('click', function (e) {
        e.preventDefault();
        dialog.open({
            url: $(e.target).attr('href'),
            options: {
                height: 600
            }
        });
    });

    // main menu toggle
    $('.menu-toggle').on('click', function () {
        $('#wrapper').toggleClass('menu-active');
    });
    $('.menu-category li .menu-item-toggle').on('click', function (e) {
        e.preventDefault();
        var $parentLi = $(e.target).closest('li');
        $parentLi.siblings('li').removeClass('active').find('.menu-item-toggle').removeClass('fa-chevron-up active').addClass('fa-chevron-right');
        $parentLi.toggleClass('active');
        $(e.target).toggleClass('fa-chevron-right fa-chevron-up active');
    });
    $('.user-account').on('click', function (e) {
        e.preventDefault();
        $(this).parent('.user-info').toggleClass('active');
    });
}
/**
 * @private
 * @function
 * @description Adds class ('js') to html for css targeting and loads js specific styles.
 */
function initializeDom() {
    // add class to html for css targeting
    $('html').addClass('js');
    if (SitePreferences.LISTING_INFINITE_SCROLL) {
        $('html').addClass('infinite-scroll');
    }
    // load js specific styles
    util.limitCharacters();
}

var pages = {
    account: require('./pages/account'),
    cart: require('./pages/cart'),
    checkout: require('./pages/checkout'),
    compare: require('./pages/compare'),
    product: require('./pages/product'),
    registry: require('./pages/registry'),
    search: require('./pages/search'),
    storefront: require('./pages/storefront'),
    wishlist: require('./pages/wishlist'),
    storelocator: require('./pages/storelocator')
};

var app = {
    init: function () {
        if (document.cookie.length === 0) {
            $('<div/>').addClass('browser-compatibility-alert').append($('<p/>').addClass('browser-error').html(Resources.COOKIES_DISABLED)).appendTo('#browser-check');
        }
        initializeDom();
        initializeEvents();

        // init specific global components
        countries.init();
        tooltip.init();
        minicart.init();
        validator.init();
        rating.init();
        searchplaceholder.init();
        // execute page specific initializations
        $.extend(page, window.pageContext);
        var ns = page.ns;
        if (ns && pages[ns] && pages[ns].init) {
            pages[ns].init();
        }

        // Check TLS status if indicated by site preference
        if (SitePreferences.CHECK_TLS === true) {
            tls.getUserAgent();
        }
    }
};

// general extension functions
(function () {
    String.format = function () {
        var s = arguments[0];
        var i, len = arguments.length - 1;
        for (i = 0; i < len; i++) {
            var reg = new RegExp('\\{' + i + '\\}', 'gm');
            s = s.replace(reg, arguments[i + 1]);
        }
        return s;
    };
})();

// initialize app
$(document).ready(function () {
    app.init();
});
