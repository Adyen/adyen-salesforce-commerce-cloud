'use strict';

const ProductUtils = require('~/cartridge/scripts/product/ProductUtils.js');
const ProductMgr = require('dw/catalog/ProductMgr');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');

const attrsWithSwatches = ['color', 'size', 'width', 'waist', 'length'];

module.exports = {
    getContext: getContext
};

/**
 * Generates context to populate template values.
 *
 * @param {dw.system.PipelineDictionary} pdict - Pipeline Dictionary / Global namespace
 * @return {Object} Context variables used to populate template placeholders
 */
function getContext (pdict) {
    const product = pdict.Product;
    const variationMaster = pdict.CurrentVariationModel == null
        ? pdict.Product.getVariationModel()
        : pdict.CurrentVariationModel;

    const selectedAttrs = product.isVariant() || product.isVariationGroup()
        ? ProductUtils.getSelectedAttributes(variationMaster)
        : {};

    const context = {
        attrs: [],
        isValidProductType: product.isVariant() || product.isVariationGroup() || product.isMaster(),
        selectedAttrs: JSON.stringify(selectedAttrs)
    };

    const variationAttrs = variationMaster.getProductVariationAttributes();
    const variationAttrsLength = variationAttrs.getLength();

    for (let i = 0; i < variationAttrsLength; i++) {
        let attr = variationAttrs[i];
        let attrAttributeId = attr.getAttributeID();
        let hasSwatch = _getHasSwatch(attrAttributeId);

        let processedAttr = {
            displayName: attr.getDisplayName(),
            attributeId: attrAttributeId,
            hasSwatch: hasSwatch,
            values: _getAttrValues({
                pdict: pdict,
                variationMaster: variationMaster,
                attr: attr
            })
        };

        if (hasSwatch) {
            processedAttr.selectedValue = _getSelectedValue(processedAttr.values);
            processedAttr.sizeChart = _getSizeChart({
                attrAttributeId: attrAttributeId,
                product: product,
                processedAttr: processedAttr
            });
        } else {
            processedAttr.masterId = pdict.Product.getVariationModel().getMaster().getID();
            processedAttr.uuid = pdict.CurrentHttpParameterMap.get('uuid');
            processedAttr.uuidStringValue = processedAttr.uuid.getStringValue();
        }

        processedAttr.resourceGlobalSelect = Resource.msg('global.select','locale',null);

        context.attrs.push(processedAttr);
    }

    return context;
}

/**
 * Process values for a variation attribute that is displayed through a pull-down menu
 *
 * @param {Object} params
 * @param {dw.system.PipelineDictionary} params.pdict
 * @param {dw.catalog.ProductVariationAttribute} params.attr
 * @param {dw.catalog.ProductVariationModel} params.variationMaster - Product Variation Model
 * @return {Object []}
 */
function _getAttrValues (params) {
    const pdict = params.pdict;
    const attr = params.attr;
    const variationMaster = params.variationMaster;
    const attrValues = variationMaster.getAllValues(attr);

    let results = [];

    for (let i = 0; i < attrValues.size(); i++) {
        let attrValue = attrValues[i];
        let attrAttributeId = attr.getAttributeID();
        let hasSwatch = _getHasSwatch(attrAttributeId);

        // Set common values between attributes with swatch and pull-down values
        let processedValue = _setCommonAttrValues({
            pdict: pdict,
            attr: attr,
            attrValue: attrValue,
            variationMaster: variationMaster
        });

        // Set additional properties needed by attributes that display values in a swatch
        if (hasSwatch) {
            processedValue = _setAttrValuesWithSwatch({
                processedValue: processedValue,
                variationMaster: variationMaster,
                attr: attr,
                attrValue: attrValue
            });

            let qs = ProductUtils.getQueryString(pdict.CurrentHttpParameterMap, ['source', 'uuid']);
            processedValue.linkUrl += qs.length == 0 ? '' : ('&' + qs);

            if (processedValue.isSelected) {
                processedValue.swatchClass += ' selected';
            }

            processedValue = _handleVariationGroup({
                attr: attr,
                pdict: pdict,
                processedValue: processedValue,
                variationMaster: variationMaster
            });


        // Set additional properties needed by attributes that display values in a pull-down menu
        } else {
            let linkUrl = variationMaster.urlSelectVariationValue('Product-Variation', attr, attrValue);
            let source = pdict.CurrentHttpParameterMap.get('source').getStringValue();

            processedValue.selected = variationMaster.isSelectedAttributeValue(attr, attrValue) ? 'selected="selected"' : '';
            processedValue.optionValue = linkUrl + '&source=' + (source || 'detail');
        }

        results.push(processedValue);
    }

    return results;
}

/**
 * Retrieves selected value of an attribute if one has been selected
 *
 * @param {Object []} attrValues
 * @param {Boolean} attrValues[].isSelected
 * @param {String} attrValues[].displayValue
 * @return {String} - Selected value
 */
function _getSelectedValue (attrValues) {
    for (let i = 0; i < attrValues.length; i++) {
        let value = attrValues[i];
        if (value.isSelected) {
            return value.displayValue;
        }
    }
}

/**
 * Check for Size Chart
 *
 * We are assuming that a custom attribute, sizeChartID, has been defined for a Catalog Category system
 * object in Business Manager > Administration > System Object Definitions > Category > Attribute Definitions
 *
 * The value assigned to this object maps to a Content Asset.
 *
 * @param {Object} params
 * @param {String} params.attrAttributeId - Attribute attributeID value
 * @param {dw.catalog.Product} params.product - Product being examined for whether a size chart should be displayed
 * @param {Object} params.processedAttr - Proxy object representing dw.catalog.ProductVariationAttribute data in a template
 * @returns {Object}
 */
function _getSizeChart (params) {
    const attrAttributeId = params.attrAttributeId;
    const product = params.product;
    const processedAttr = params.processedAttr;

    if (attrAttributeId != 'color' && !processedAttr.sizeChart) {
        let category = product.getPrimaryCategory();

        if (!category && (product.isVariant() || product.isVariationGroup())) {
            category = product.getMasterProduct().getPrimaryCategory();
        }

        while (category && !processedAttr.sizeChart) {
            const sizeChartId = category.custom.sizeChartID;

            if (sizeChartId) {
                return {
                    id: sizeChartId,
                    url: URLUtils.url('Page-Show','cid', sizeChartId),
                    title: Resource.msg('product.variations.sizechart.label', 'product', null),
                    label: Resource.msg('product.variations.sizechart', 'product', null)
                };
            }

            category = category.parent;
        }
    }
}

/**
 * Set common properties shared by swatch and pull-down menu attribute values
 *
 * @param {Object} params
 * @param {dw.system.PipelineDictionary} params.pdict
 * @param {dw.catalog.ProductVariationAttribute} params.attr
 * @param {dw.catalog.ProductVariationAttributeValue} params.attrValue
 * @param {dw.catalog.ProductVariationModel} params.variationMaster - Product Variation Model
 * @return {Object}
 */
function _setCommonAttrValues(params) {
    const pdict = params.pdict;
    const attr = params.attr;
    const attrValue = params.attrValue;
    const variationMaster = params.variationMaster;

    const product = pdict.Product;
    const cleanvariationMaster = _getCleanPvm(product);
    const largeImage = variationMaster.getImage('large', attr, attrValue);

    const processedValue = {
        displayValue: attrValue.getDisplayValue() || attrValue.getValue(),
        isAvailable: variationMaster.hasOrderableVariants(attr, attrValue),
        isOrderableInMaster: cleanvariationMaster.hasOrderableVariants(attr, attrValue),
        largeImage: JSON.stringify({
            url: largeImage.getURL().toString(),
            title: largeImage.getTitle(),
            alt: largeImage.getAlt(),
            hires: attrValue.getImage('hi-res') || ''
        })
    };

    return processedValue;
}

/**
 * Set properties on attribute value displayed in a swatch
 *
 * @param {Object} params
 * @param {Object} params.processedValue
 * @param {dw.catalog.ProductVariationAttribute} params.attr
 * @param {dw.catalog.ProductVariationAttributeValue} params.attrValue
 * @param {dw.catalog.ProductVariationModel} params.variationMaster - Product Variation Model
 * @param {dw.catalog.ProductVariationAttribute} params.attr
 * @return {Object}
 */
function _setAttrValuesWithSwatch (params) {
    const processedValue = params.processedValue;
    const attr = params.attr;
    const attrValue = params.attrValue;
    const variationMaster = params.variationMaster;

    const attrAttributeId = attr.getAttributeID();
    const attrValueDisplayName = attrValue.getDisplayValue();

    const isSelectable = variationMaster.hasOrderableVariants(attr, attrValue);
    const swatchImage = attrValue.getImage('swatch');
    const isSelected = variationMaster.isSelectedAttributeValue(attr, attrValue);
    const linkUrl = isSelected
        ? variationMaster.urlUnselectVariationValue('Product-Variation', attr)
        : variationMaster.urlSelectVariationValue('Product-Variation', attr, attrValue);

    processedValue.displayName = attrValueDisplayName;
    processedValue.isSelectable = isSelectable;
    processedValue.isSelected = isSelected;
    processedValue.linkUrl = linkUrl;
    processedValue.isColorSwatch = swatchImage && attrAttributeId == 'color' ? true : false;
    processedValue.swatchClass = isSelectable ? 'selectable' : 'unselectable';
    processedValue.swatchImageUrl = swatchImage ? swatchImage.getURL() : undefined;
    processedValue.resourceVariationsLabel = Resource.msgf('product.variations.label', 'product', null, attr.getDisplayName(), attrValueDisplayName);
    processedValue.resourceVariationNotAvailable = Resource.msgf('product.variationnotavailable','product', null, attrAttributeId, attrValueDisplayName);

    return processedValue;
}

/**
 * Special handling for Variation Group product
 *
 * @param {Object} params
 * @param {dw.catalog.ProductVariationAttribute} params.attr - Variation attribute
 * @param {dw.system.PipelineDictionary} params.pdict
 * @param {Object} params.processedValue - Proxy object representing a variation attribute value
 * @param {dw.catalog.ProductVariationModel} params.variationMaster - Product Variation Model
 * @return {Object}
 */
function _handleVariationGroup (params) {
    const attr = params.attr;
    const pdict = params.pdict;
    const processedValue = params.processedValue;
    const variationMaster = params.variationMaster;

    const product = pdict.Product;
    const variationGroupId = pdict.CurrentHttpParameterMap.vgid;
    const variationGroup = product.isVariationGroup()
        ? product
        : variationGroupId
            ? ProductMgr.getProduct(variationGroupId)
            : undefined;

    if (variationGroup) {
        processedValue.linkUrl += '&vgid=' + variationGroup.getID();

        // variationMaster.getVariationValue returns `null` for attribute that
        // is not assigned to the variation group
        if (variationMaster.getVariationValue(variationGroup, attr) === null) {
            processedValue.swatchClass += ' variation-group-value';
        }
    }

    return processedValue;
}

/**
 * Return a product's variation model or, in the case of a variant, its master product's variation model
 *
 * The "clean" ProductVariationModel of the master without any selected attribute values is used to filter the variants.
 * Otherwise hasOrderableVariants() would use currently selected values resulting in a too narrow selection of variants.
 *
 * @param {dw.catalog.Product} product
 * @return {dw.catalog.ProductVariationModel}
 */
function _getCleanPvm (product) {
    return product.isVariant() ? product.getMasterProduct().getVariationModel() : product.getVariationModel();
}

/**
 * Determines whether an attribute's values are displayed in a swatch
 *
 * @param {String} attrAttributeId - An attribute's attributeID
 * @return {Boolean}
 */
function _getHasSwatch (attrAttributeId) {
    return attrsWithSwatches.indexOf(attrAttributeId) > -1;
}
