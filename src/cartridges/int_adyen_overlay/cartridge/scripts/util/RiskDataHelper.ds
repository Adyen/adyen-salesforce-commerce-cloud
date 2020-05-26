/**
 * Risk data fields
 */

importPackage(dw.order);
var LineItemHelper = require("*/cartridge/scripts/util/LineItemHelper");

var __RiskDataHelper  = {
    createBasketContentFields: function(order) {
        var productLines = order.getAllProductLineItems().toArray();
        var itemNr = 1;
        var basketData = {};
        productLines.forEach(function(item){
            var quantity = LineItemHelper.getQuantity(item);
            basketData['riskdata.basket.item' + itemNr + '.itemID'] = LineItemHelper.getId(item);
            basketData['riskdata.basket.item' + itemNr + '.productTitle'] = LineItemHelper.getDescription(item);
            basketData['riskdata.basket.item' + itemNr + '.amountPerItem'] = LineItemHelper.getItemAmount(item) / quantity;
            basketData['riskdata.basket.item' + itemNr + '.currency'] = item.adjustedNetPrice.currencyCode;
            basketData['riskdata.basket.item' + itemNr + '.upc'] = (item.product ? item.product.UPC : "");
            basketData['riskdata.basket.item' + itemNr + '.sku'] = (item.product ? item.product.manufacturerSKU : "");
            basketData['riskdata.basket.item' + itemNr + '.brand'] = (item.product ? item.product.brand : "");
            basketData['riskdata.basket.item' + itemNr + '.manufacturerName'] = (item.product ? item.product.manufacturerName : "");
            basketData['riskdata.basket.item' + itemNr + '.category'] = ((item.product && item.product.primaryCategory) ? item.product.primaryCategory.displayName : "");
            basketData['riskdata.basket.item' + itemNr + '.quantity'] = quantity;
            itemNr ++;
        });
        return basketData;
    }
}

module.exports = __RiskDataHelper;