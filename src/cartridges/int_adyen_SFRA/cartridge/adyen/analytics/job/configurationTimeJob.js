const File = require('dw/io/File');
const FileReader = require('dw/io/FileReader');
const XMLStreamReader = require('dw/io/XMLStreamReader');
const XMLStreamConstants = require('dw/io/XMLStreamConstants');
const Status = require('dw/system/Status');
const analyticsEvent = require('*/cartridge/adyen/analytics/analyticsEvents');
const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { AdyenError } = require('*/cartridge/adyen/logs/adyenError');

function searchForServiceCredential(
  xmlStreamReader,
  servicesXmlFile,
  serviceIdToFind,
) {
  while (xmlStreamReader.hasNext()) {
    if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
      const elementName = xmlStreamReader.getLocalName();
      if (elementName === 'service-credential') {
        const currentServiceId = xmlStreamReader.getAttributeValue(
          null,
          'service-credential-id',
        );
        if (currentServiceId === serviceIdToFind) {
          return true;
        }
      }
    }
  }
  return false;
}

function hasServiceCredential(servicesXmlFile, serviceIdToFind) {
  if (!servicesXmlFile || !servicesXmlFile.exists() || !serviceIdToFind) {
    AdyenLogs.info_log(
      'Invalid input: Please provide a valid file object and a service ID to find.',
    );
    return false;
  }

  let fileReader = null;
  let xmlStreamReader = null;
  let isFound = false;

  try {
    fileReader = new FileReader(servicesXmlFile, 'UTF-8');
    xmlStreamReader = new XMLStreamReader(fileReader);
    isFound = searchForServiceCredential(
      xmlStreamReader,
      servicesXmlFile,
      serviceIdToFind,
    );
  } catch (error) {
    AdyenLogs.error_log('Error parsing services.xml', error);
    isFound = false;
  } finally {
    xmlStreamReader?.close();
    fileReader?.close();
  }

  return isFound;
}

function deleteDirectoryRecursive(directory) {
  const files = directory.listFiles();
  if (files.empty) {
    directory.remove();
    return;
  }

  const fileIterator = files.iterator();
  while (fileIterator.hasNext()) {
    const file = fileIterator.next();
    if (file.isDirectory()) {
      deleteDirectoryRecursive(file);
    } else {
      file.remove();
    }
  }
  directory.remove();
}

// eslint-disable-next-line complexity
function execute() {
  const targetDir = new File('IMPEX/src/instance');

  if (!targetDir.exists() || !targetDir.isDirectory()) {
    throw new AdyenError(
      `Target directory ${targetDir.getFullPath()} not found.`,
    );
  }

  const files = targetDir.listFiles();
  if (files.empty) {
    throw new AdyenError('No files found to process.');
  }

  const fileIterator = files.iterator();
  while (fileIterator.hasNext()) {
    const currentFile = fileIterator.next();
    if (currentFile.isFile()) {
      try {
        const isZipFile = currentFile.getName().toLowerCase().endsWith('.zip');
        if (isZipFile) {
          const tempUnzipDir = new File(
            `IMPEX/src/instance/${currentFile.getName()}_unzipped_temp`,
          );
          if (tempUnzipDir.exists()) {
            deleteDirectoryRecursive(tempUnzipDir);
          }
          tempUnzipDir.mkdirs();
          currentFile.unzip(tempUnzipDir);

          const extractedFiles = tempUnzipDir.listFiles();
          const extractedFileIterator = extractedFiles.iterator();
          let isAdyenDefined = false;
          while (extractedFileIterator.hasNext()) {
            const extractedFile = extractedFileIterator.next();
            if (!extractedFile.isFile()) {
              const servicesFile = new File(
                `${tempUnzipDir.getFullPath()}/${extractedFile.getName()}/services.xml`,
              );
              isAdyenDefined = hasServiceCredential(
                servicesFile,
                'AdyenPayment',
              );
              if (isAdyenDefined) {
                break;
              }
            }
          }
          deleteDirectoryRecursive(tempUnzipDir);
          if (isAdyenDefined) {
            AdyenLogs.info_log(
              `create analytics event ${session.sessionID.slice(0, 200)} ${analyticsConstants.eventSource.CONFIGURATION_TIME}`,
            );
            analyticsEvent.createAnalyticsEvent(
              session.sessionID.slice(0, 200),
              analyticsConstants.eventSource.CONFIGURATION_TIME,
              analyticsConstants.eventType.EXPECTED_START,
              analyticsConstants.eventCode.INFO,
            );
            break;
          }
        }
      } catch (e) {
        const name = currentFile.getName();
        AdyenLogs.error_log(`Error processing zip file ${name}`, e);
        return new Status(Status.ERROR, 'ERROR', e.message);
      }
    }
  }
  return new Status(
    Status.OK,
    'SUCCESS',
    `Files in ${targetDir.getFullPath()} processed.`,
  );
}

module.exports = {
  execute,
};
