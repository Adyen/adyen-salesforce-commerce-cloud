/**
* A library file providing adyen common functions.
*/

importPackage( dw.system );

var AdyenHelper = {
	
	/**
	* @function getResponseObj Extract all parameters from the adyen text response and return all in an object
	* @param queryString The adyen text response
	*/
	getResponseObj : function ( queryString : String ) {
		var vars = queryString.split('&');
		var responseObj : Object = new Object();
		var property : Array;
		var elem : String; 
		for each (elem in vars) {
			property = elem.split('=');
			var lastDot = property[0].lastIndexOf('.');
			var	tempProperty = property[0].substring(lastDot + 1);
			responseObj[tempProperty] = decodeURIComponent(property[1]);
		}
		return responseObj;
	}
}

// function used for the helper export
function getAdyenHelper() {
	return AdyenHelper;
}
