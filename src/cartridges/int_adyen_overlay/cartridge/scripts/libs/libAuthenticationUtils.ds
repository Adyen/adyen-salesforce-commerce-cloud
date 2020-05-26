/**
*
* Script use to handle authentications for different Adyen (in) calls 
*
*/

importPackage( dw.content );
importPackage( dw.io );
importPackage( dw.crypto );
importPackage( dw.system );
importPackage( dw.util );

/**
*
* Class accessor
*/
function AuthenticationUtils() {};

/**
*
* @function Checks the Basic Authentication header agains the give user and password combination
* @param baHeader The Basic Authentication header
* @param baUser The Basic Authentication user
* @param baPassword The basic Authentication password 
*/
AuthenticationUtils.checkGivenCredentials = function( baHeader : String, baUser : String, baPassword : String) : Boolean {
	var basicPrefix : String = "Basic";
	if (!empty(baHeader) && baHeader.indexOf(basicPrefix) == 0) {		
		// Authorization: Basic base64credentials
		var base64Credentials : String = baHeader.substring(basicPrefix.length).trim();
		var credentials : String = StringUtils.decodeBase64(base64Credentials);
		// credentials = username:password
		var values : Array = credentials.split(":",2);	
			
		return (values[0] == baUser && values[1] == baPassword);
	}
	return false;		
}
