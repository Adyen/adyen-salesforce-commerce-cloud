'use strict';

var SuggestModel = require('dw/suggest/SuggestModel');
var ArrayList = require('dw/util/ArrayList');

function getProductSuggestions(suggestModel) {
	var suggestions = suggestModel.getProductSuggestions();
	if (!suggestions) {
		return {
			available: false
		};
	}
	return {
		available: suggestions.hasSuggestions(),
		terms: suggestions.getSuggestedTerms(),
		products: suggestions.getSuggestedProducts(),
		phrases: suggestions.getSuggestedPhrases()
	};
}

function getBrandSuggestions(suggestModel) {
	var suggestions = suggestModel.getBrandSuggestions();
	if (!suggestions) {
		return {
			available: false
		};
	}
	return {
		available: suggestions.hasSuggestedPhrases(),
		phrases: suggestions.getSuggestedPhrases()
	};
}

function getContentSuggestions(suggestModel) {
	var suggestions = suggestModel.getContentSuggestions();
	if (!suggestions) {
		return {
			available: false
		};
	}
	return {
		available: suggestions.hasSuggestions(),
		content: suggestions.getSuggestedContent()
	};
}

function getCategorySuggestions(suggestModel) {
	var suggestions = suggestModel.getCategorySuggestions();
	if (!suggestions) {
		return {
			available: false
		};
	}
	return {
		available: suggestions.hasSuggestions(),
		phrases: suggestions.getSuggestedPhrases(),
		categories: suggestions.getSuggestedCategories()
	};
}

function getCustomSuggestions(suggestModel) {
	var suggestions = suggestModel.getCustomSuggestions();
	if (!suggestions) {
		return {
			available: false
		};
	}

	// filter custom phrase that matches exactly the suggested search phrase for products
	var customPhrasesUnfiltered = suggestions.getSuggestedPhrases();
	var customPhrasesFiltered;

	var productSuggestions = suggestModel.getProductSuggestions();
    if (productSuggestions && productSuggestions.hasSuggestedPhrases()) {
        var productPhrase = productSuggestions.getSuggestedPhrases().next().getPhrase();
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

	return {
		available: customPhrasesFiltered.hasNext(),
		phrases: customPhrasesFiltered
	};
}


module.exports = function (searchPhrase, maxSuggestions) {
	var suggestModel = new SuggestModel();
	suggestModel.setSearchPhrase(searchPhrase);
	suggestModel.setMaxSuggestions(maxSuggestions);
	if (!suggestModel) {
		return;
	}

	var product = getProductSuggestions(suggestModel);
	var brand = getBrandSuggestions(suggestModel);
	var category = getCategorySuggestions(suggestModel);
	var content = getContentSuggestions(suggestModel);
	var custom = getCustomSuggestions(suggestModel);

	return {
		product: product,
		brand: brand,
		category: category,
		content: content,
		custom: custom
	};
};
