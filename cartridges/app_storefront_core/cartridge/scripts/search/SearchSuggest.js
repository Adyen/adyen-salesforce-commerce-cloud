'use strict';

// Initialize any constants
var SuggestModel = require('dw/suggest/SuggestModel');
var ArrayList = require('dw/util/ArrayList');

/**
 * @function getProductSuggestions
 * @param {SuggestModel} suggestModel Represents the suggest model seeded with the user's search query
 * @description Accepts a suggest model -- and returns an object containing the product suggestions found for the search query
 * @returns {Object} Returns an object describing which product suggestions exist for a given search query
 */
function getProductSuggestions(suggestModel) {

    // Retrieve the product suggestions
    var suggestions = suggestModel.getProductSuggestions();

    // Were any product suggestions found?
    if (!suggestions) {
        return {
            available: false,
            products: false
        };
    }

    // Initialize the suggested products / suggested phrases
    var searchPhrasesSuggestions = suggestions.getSearchPhraseSuggestions();
    var suggestedPhrases = searchPhrasesSuggestions.getSuggestedPhrases();
    var suggestedProducts = suggestions.getSuggestedProducts();
    var suggestedPhrasesList = suggestedPhrases.asList();

    return {
        available: suggestions.hasSuggestions(),
        terms: searchPhrasesSuggestions.getSuggestedTerms(),
        products: suggestedProducts,
        phrases: suggestedPhrasesList
    };

}

/**
 * @function getRecentSearchPhrases
 * @param {SuggestModel} suggestModel Represents the suggest model seeded with the user's search query
 * @description Accepts a suggest model -- and returns the collection of recent search phrases
 * @returns {Object} Returns an object describing which recent search phrases exist for the current user
 */
function getRecentSearchPhrases(suggestModel) {

    // Retrieve the recent search suggestions
    var recentSearchPhrases = suggestModel.getRecentSearchPhrases();

    // Were any recent search suggestions found?
    if (!recentSearchPhrases) {
        return {
            available: false
        };
    }

    // Return the recent search phrases
    return {
        available: recentSearchPhrases.hasNext(),
        phrases: recentSearchPhrases
    };

}

/**
 * @function getPopularSearchPhrases
 * @param {SuggestModel} suggestModel Represents the suggest model seeded with the user's search query
 * @description Accepts a suggest model -- and returns the collection of popular search phrases
 * @returns {Object} Returns an object describing which recent popular phrases exist for site
 */
function getPopularSearchPhrases(suggestModel) {

    // Retrieve the popular search phrases for the current site
    var popularSearchPhrases = suggestModel.getPopularSearchPhrases();

    // Were any popular search phrases found?
    if (!popularSearchPhrases) {
        return {
            available: false
        };
    }

    // Return the popular search phrases
    return {
        available: popularSearchPhrases.hasNext(),
        phrases: popularSearchPhrases
    };

}

/**
 * @function getCustomSuggestions
 * @param {SuggestModel} suggestModel Represents the suggest model seeded with the user's search query
 * @description Accepts a suggest model -- and returns the collection of filtered custom search phrases
 * @returns {Object} Returns an object describing which custom / filtered search suggestions exist
 */
function getCustomSuggestions(suggestModel) {

    // Retrieve the custom suggestions
    var suggestions = suggestModel.getCustomSuggestions();

    // Were any custom suggestions found?
    if (!suggestions) {
        return {
            available: false
        };
    }

    // Filter custom phrases that matches exactly the suggested search phrase for products
    var customPhrasesFiltered;
    var customPhrasesUnfiltered = suggestions.getSearchPhraseSuggestions().getSuggestedPhrases();
    var productSuggestions = suggestModel.getProductSuggestions();

    // Filter out the custom phrases that match the product phrase
    if (productSuggestions && productSuggestions.getSearchPhraseSuggestions().hasSuggestedPhrases()) {
        var productPhrase = productSuggestions.getSearchPhraseSuggestions().getSuggestedPhrases().next().getPhrase();
        var filtered = new ArrayList();
        while (customPhrasesUnfiltered.hasNext()) {
            var customPhrase = customPhrasesUnfiltered.next();
            if (!productPhrase.toUpperCase().equals(customPhrase.getPhrase().toUpperCase())) {
                filtered.push(customPhrase);
            }
        }
        customPhrasesFiltered = filtered.iterator();
    } else {
        // no product suggestions, just pass the custom phrase unfiltered
        customPhrasesFiltered = customPhrasesUnfiltered;
    }

    // Return the custom suggestions
    return {
        available: customPhrasesFiltered.hasNext(),
        phrases: customPhrasesFiltered
    };

}

/**
 * @function getBrandSuggestions
 * @param {SuggestModel} suggestModel Represents the suggest model seeded with the user's search query
 * @description Accepts a suggest model -- and returns the collection of brand search suggestions
 * @returns {Object} Returns an object describing which brand-specific search suggestions exist
 */
function getBrandSuggestions(suggestModel) {

    // Retrieve the brand suggestions
    var suggestions = suggestModel.getBrandSuggestions();

    // Were any brand-specific suggestions found?
    if (!suggestions) {
        return {
            available: false
        };
    }

    // Return the brand suggestions
    return {
        available: suggestions.getSearchPhraseSuggestions().hasSuggestedPhrases(),
        phrases: suggestions.getSearchPhraseSuggestions().getSuggestedPhrases()
    };

}

/**
 * @function getCategorySuggestions
 * @param {SuggestModel} suggestModel Represents the suggest model seeded with the user's search query
 * @description Accepts a suggest model -- and returns the collection of category-specific search suggestions
 * @returns {Object} Returns an object describing which category-specific search suggestions exist
 */
function getCategorySuggestions(suggestModel) {

    // Retrieve the category suggestions
    var suggestions = suggestModel.getCategorySuggestions();

    // Were any category suggestions found?
    if (!suggestions) {
        return {
            available: false
        };
    }

    // Return the category suggestions
    return {
        available: suggestions.hasSuggestions(),
        phrases: suggestions.getSearchPhraseSuggestions().getSuggestedPhrases(),
        categories: suggestions.getSuggestedCategories()
    };

}

/**
 * @function getContentSuggestions
 * @param {SuggestModel} suggestModel Represents the suggest model seeded with the user's search query
 * @description Accepts a suggest model -- and returns the collection of content-specific search suggestions
 * @returns {Object} Returns an object describing which content-specific search suggestions exist
 */
function getContentSuggestions(suggestModel) {

    // Retrieve the content search suggestions
    var suggestions = suggestModel.getContentSuggestions();

    // Were any content suggestions found?
    if (!suggestions) {
        return {
            available: false
        };
    }

    // Return the content suggestions
    return {
        available: suggestions.hasSuggestions(),
        content: suggestions.getSuggestedContent()
    };

}

module.exports = function (searchPhrase, maxSuggestions) {

    // Initialize the suggest model
    var suggestModel = new SuggestModel();

    // Set the search phrase and maximum number of suggestions to retrieve
    suggestModel.setSearchPhrase(searchPhrase);
    suggestModel.setMaxSuggestions(maxSuggestions);

    // Exit early if no suggestions are returned
    if (!suggestModel) { return; }

    // Retrieve the product and product-search phrase suggestions
    var product = getProductSuggestions(suggestModel);

    // Retrieve the recent and popular search suggestions
    var recent = getRecentSearchPhrases(suggestModel);
    var popular = getPopularSearchPhrases(suggestModel);

    // Retrieve standard search suggestions
    var custom = getCustomSuggestions(suggestModel);
    var brand = getBrandSuggestions(suggestModel);
    var category = getCategorySuggestions(suggestModel);
    var content = getContentSuggestions(suggestModel);

    return {
        product: product,
        recent: recent,
        popular: popular,
        custom: custom,
        brand: brand,
        category: category,
        content: content
    };

};
