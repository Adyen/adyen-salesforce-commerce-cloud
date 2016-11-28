'use strict';
/**
 * Model for the custom logic of the product compare feature.
 * The implementation is bundled into a class which provides
 * method access the compare data. The compare data itself is stored as
 * a JSON string in the privacy attributes of the session.
 *
 * @module models/CompareModel
 */

/**
 * Constructs a new compare list.
 * @constructor
 * @constructs module:models/CompareModel~CompareList
 */
function CompareList() {
    /** Copy of reference to this, for use in scopes where this refers to another object. */
    var that = this;

    /** The ID of the category currently being compared. */
    var currentCategoryID = null;

    /** Hash of category IDs to arrays of product IDs. */
    var categoryProducts = {};

    /** Returns the current category of products to compare.
    * @alias module:models/CompareModel~CompareList/getCategory
    * @return {String} Current category ID.
    */
    this.getCategory = function () {
        return currentCategoryID;
    };

    /**
     * Returns a set of IDs of products being compared for the current category,
     * or the empty set if no category is selected.
     *
     * @alias module:models/CompareModel~CompareList/getProducts
     * @return {dw.util.LinkedHashSet} Product IDs of any products being compared for the current category.
     */
    this.getProducts = function () {
        var products = new dw.util.LinkedHashSet();

        if (currentCategoryID !== null) {
            var categoryProductArray = categoryProducts[currentCategoryID];
            if (categoryProductArray) {
                for (var i = 0; i < categoryProductArray.length; i++) {
                    products.add(categoryProductArray[i]);
                }
            }
        }

        return products;
    };

    /**
     * Returns a map of category IDs and names, for all categories
     * that have at least one product to compare.
     *
     * @alias module:models/CompareModel~CompareList/getCategories
     * @return {dw.util.LinkedHashMap} Map of category IDs and display names.
     */
    this.getCategories = function () {
        var categories = new dw.util.LinkedHashMap();

        for (var categoryID in categoryProducts) {
            var category = dw.catalog.CatalogMgr.getCategory(categoryID);
            if (category !== null) {
                categories.put(categoryID, category.getDisplayName());
            }
        }

        return categories;
    };

    /** Returns a set of maps, each map representing an attribute group.
    *
    * @alias module:models/CompareModel~CompareList/getAttributeGroups
    * @return {dw.util.LinkedHashSet} Attribute groups are returned as a set of maps, where each attribute group
    * is a separate map.
    * @see module:models/CompareModel~CompareList/findAttributeGroups for map structure information.
    */
    this.getAttributeGroups = function () {
        if (currentCategoryID === null) {
            return new dw.util.LinkedHashSet();
        }

        var categoryProductArray = categoryProducts[currentCategoryID];
        if (!categoryProductArray) {
            return new dw.util.LinkedHashSet();
        }

        // Creates a list of paths from root to classification category for products.
        var paths = new dw.util.ArrayList();
        for (var i = 0; i < categoryProductArray.length; i++) {
            // Gets the product with this ID.
            var p = dw.catalog.ProductMgr.getProduct(categoryProductArray[i]);
            if (p !== null) {
                var category = p.getClassificationCategory();

                var path = new dw.util.ArrayList();
                while (category !== null) {
                    path.addAt(0, category);
                    category = category.getParent();
                }

                paths.add(path);
            }
        }
        return findAttributeGroups(findDeepestCommonCategory(paths));
    };

    /**
     * Returns the deepest common category among the given list of paths starting at the root.
     *
     * @alias module:models/CompareModel~CompareList/findDeepestCommonCategory
     * @param {dw.util.ArrayList} paths - List of paths from root to category.
     */
    function findDeepestCommonCategory(paths) {
        // No common category if no paths.
        if ((paths === null) || paths.isEmpty()) {
            return null;
        }

        // Assume no common category.
        /** @type {dw.catalog.Category} */
        var deepestCommonCategory = null;

        // Compares the first path to the others.
        /** @type {dw.util.ArrayList} */
        var comparePath = paths.get(0);
        for (var i = 0; i < comparePath.size(); i++) {
            // Gets category at level i in the first path.
            var compareCategory = comparePath.get(i);
            if (compareCategory === null) {
                return deepestCommonCategory;
            }

            // Compares category to level i categories in other paths.
            for (var j = 1; j < paths.size(); j++) {
                var otherPath = paths.get(j);

                // Quit if other path is shorter.
                if (i >= otherPath.size()) {
                    return deepestCommonCategory;
                }

                // Quits if the other path has a different category at level i.
                var otherCategory = otherPath.get(i);
                if ((otherCategory === null) || (otherCategory.getID() !== compareCategory.getID())) {
                    return deepestCommonCategory;
                }
            }

            // Updates deepest common category among paths.
            deepestCommonCategory = compareCategory;
        }

        return deepestCommonCategory;
    }

    /**
     * Returns the set of attribute groups for the given classification category,
     * each one represented as a map.
     *
     * @alias module:models/CompareModel~CompareList/findAttributeGroups
     * @param {dw.catalog.Category} classificationCategory - The classification category.
     * @return {dw.util.LinkedHashSet} Set of maps containing attribute groups.
     * Each map contains:
     *<ul>
     *<li>descriptor - description of visible attributes in the group.</li>
     *<li>displayName - display name of visible attributes in the group.</li>
     *<li>attributes - an ArrayList of HashMaps. Each map contains the descriptor and display name for an attribute in the group. </li>
     *</ul>
     *
     */
    function findAttributeGroups(classificationCategory) {
        // Gets the product attribute model.
        var model;
        if (classificationCategory === null) {
            model = new dw.catalog.ProductAttributeModel();
        } else {
            model = classificationCategory.getProductAttributeModel();
        }

        // Gets the attribute groups for attribute model.
        var persistentAttributeGroups = model.getVisibleAttributeGroups().iterator();

        var attributeGroups = new dw.util.LinkedHashSet();
        while (persistentAttributeGroups.hasNext()) {
            var persistentAttributeGroup = persistentAttributeGroups.next();
            var persistentAttributeDescriptors = model.getVisibleAttributeDefinitions(persistentAttributeGroup).iterator();

            // Creates attributes.
            var groupAttributes = new dw.util.ArrayList();
            while (persistentAttributeDescriptors.hasNext()) {
                var persistentAttributeDescription = persistentAttributeDescriptors.next();
                var attributeDesc = new dw.util.HashMap();

                attributeDesc.put('descriptor', persistentAttributeDescription);
                attributeDesc.put('displayName', persistentAttributeDescription.getDisplayName());

                groupAttributes.add(attributeDesc);
            }

            // Creates attribute group.
            var attributeGroup = new dw.util.HashMap();
            attributeGroup.put('descriptor', persistentAttributeGroup);
            attributeGroup.put('displayName', persistentAttributeGroup.getDisplayName());
            attributeGroup.put('attributes', groupAttributes);

            attributeGroups.add(attributeGroup);
        }

        return attributeGroups;
    }

    /** Stores a representation of this product comparison in the session.
    *
    * @alias module:models/CompareModel~CompareList/store
    */
    function store() {
        session.privacy.productComparison = toJSON();
    }

    /** Returns a string representation of this compare list, used to store comparison information in the session.
    * @return {String} JSON object representing a product comparison.
    */
    function toJSON() {
        var o = {
            cid: (currentCategoryID ? currentCategoryID : null),
            prods: categoryProducts
        };
        return JSON.stringify(o);
    }

    /**
     * Sets the state of this compare list based on the given string, typically from the session.
     * Saves the product comparison to the session.
     * @alias module:models/CompareModel~CompareList/fromJSON
     * @param {String} json JSON data
     * @see module:models/CompareModel~CompareList/store
     */
    this.fromJSON = function (json) {
        if (!json) {
            return;
        }
        try {
            var data = JSON.parse(json);
            currentCategoryID = data.cid ? data.cid : null;
            categoryProducts = data.prods ? data.prods : {};
        } catch (e) {
            dw.system.Logger.error(e);
        }
    };

    /**
     * Sets the current category of products to compare to the one with the given ID.
     * Saves the current product comparison to the session.
     * @alias module:models/CompareModel~CompareList/setCategory
     * @param {String} categoryID - The category ID.
     * @see module:models/CompareModel~CompareList/store
     */
    this.setCategory = function (categoryID) {
        currentCategoryID = categoryID;
        copyParentCategory();

        store();
    };

    /**
     * Adds a product to the set of compared products for the given category.
     * Saves the current product comparison to the session.
     * @alias module:models/CompareModel~CompareList/add
     * @param {dw.catalog.Product} p the product to add
     * @param {dw.catalog.Category} c the category for which to add the object
     * @see module:models/CompareModel~CompareList/store
     */
    this.add = function (p, c) {
        var products = categoryProducts[c.getID()];

        // Creates set if necessary.
        if (!products) {
            products = [];
            categoryProducts[c.getID()] = products;
        }

        // Checks if the product is already in set.
        var found = false;
        for (var i = 0; i < products.length; i++) {
            found |= (products[i] === p.getID());
        }

        // Adds the product if it is not.
        if (!found) {
            products.push(p.getID());
        }

        store();
    };

    /**
     * Copies to the current category the applicable compare products of the parent category,
     * if there are no products to compare for the current category.
     *
     * @alias module:models/CompareModel~CompareList/copyParentCategory
     */
    function copyParentCategory() {
        // Quits if no category set is set.
        if (currentCategoryID === null) {
            return;
        }

        // Quits if the category already has products.
        if (categoryProducts[currentCategoryID]) {
            return;
        }

        // Gets the category.
        var category = dw.catalog.CatalogMgr.getCategory(currentCategoryID);
        if (category === null) {
            return;
        }

        // Gets the parent category.
        var parent = category.getParent();
        if (parent === null) {
            return;
        }

        // Gets product IDs for parent category.
        var products = categoryProducts[parent.getID()];
        if (!products) {
            return;
        }

        // Adds products from parent category also assigned to the category.
        for (var i = 0; i < products.length; i++) {
            var product = dw.catalog.ProductMgr.getProduct(products[i]);
            if ((product !== null) && productAssignedToCategory(product, category)) {
                that.add(product, category);
            }
        }
    }

    /**
     * Checks if a product is assigned to a category or any child category of the category.
     *
     * @alias module:models/CompareModel~CompareList/productAssignedToCategory
     * @param {dw.catalog.Product} p product
     * @param {dw.catalog.Category} c  category
     * @returns {Boolean} true if the product is assigned to the given category or one of its children,
     * or false if it is not.
     */
    function productAssignedToCategory(p, c) {
        var assignments = p.getCategoryAssignments();
        for (var it = assignments.iterator(); it.hasNext();) {
            var assignment = it.next();

            var assignedCategory = assignment.getCategory();
            while (assignedCategory !== null) {
                if (assignedCategory.getID() === c.getID()) {
                    return true;
                }

                assignedCategory = assignedCategory.getParent();
            }
        }

        return false;
    }

    /**
     * Removes the given product from the set of compared products for the given category.
     * Saves the current product comparison to the session.
     *
     * @alias module:models/CompareModel~CompareList/remove
     * @param {dw.catalog.Product} p the product to remove
     * @param {dw.catalog.Category} c the category for which to remove the object
     * @see module:models/CompareModel~CompareList/store
     */
    this.remove = function (p, c) {
        var products = categoryProducts[c.getID()];

        // Quits if there are no products for the category.
        if (!products) {
            return;
        }

        // Builds copy of products array without the product.
        var newProducts = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i] !== p.getID()) {
                newProducts.push(products[i]);
            }
        }

        // Removes category if the last product was removed.
        if (newProducts.length === 0) {
            delete categoryProducts[c.getID()];
        // Otherwise, sets the updated products array for category.
        } else {
            categoryProducts[c.getID()] = newProducts;
        }

        // Removes the product from subcategories of the category
        for (var it = c.getSubCategories().iterator(); it.hasNext();) {
            this.remove(p, it.next());
        }

        store();
    };
}

/**
 * Returns the product compare list, possibly restored using JSON data from the session.
 *
 * @return {models/CompareModel~CompareList} The compare list
 */
exports.get = function () {
    // Creates the transient compare list.
    var compareList = new CompareList();

    // If there is compare data stored in the session
    // restores the compare list with this data.
    compareList.fromJSON(session.privacy.productComparison);

    return compareList;
};
