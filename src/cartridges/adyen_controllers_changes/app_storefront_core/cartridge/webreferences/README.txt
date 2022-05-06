This directory is for web services that use Apache Axis.

Create the following files:

* filename.wsdl - The wsdl file for the web service.

* filename.jks - (optional) If you are using a java keystore file for ws-security, it must 
  have the same filename as the wsdl.

* filename.properties - (optional) If you are using the properties file to generate fully 
  qualified class names to avoid class name collisions.  See Resolving namespace collisions 
  for WSDLs and associated files(https://documentation.demandware.com/DOC1/topic/help/WebServices/Webservices.html).

Note: The filename for all three files must be identical for the files to be used by the platform.