const File = require('dw/io/File');
const FileReader = require('dw/io/FileReader');
const XMLStreamReader = require('dw/io/XMLStreamReader');
const XMLStreamConstants = require('dw/io/XMLStreamConstants');
const Status = require('dw/system/Status');
const AdyenLogs = require('../../logs/adyenCustomLogs');

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
    return new Status(
      Status.ERROR,
      'DIR_NOT_FOUND',
      `Target directory ${targetDir.getFullPath()} not found.`,
    );
  }

  const files = targetDir.listFiles();
  const fileIterator = files.iterator();

  if (files.empty) {
    return new Status(Status.OK, 'NO_FILES', 'No files found to process.');
  }

  while (fileIterator.hasNext()) {
    const currentFile = fileIterator.next();
    if (currentFile.isFile()) {
      try {
        if (currentFile.getName().toLowerCase().endsWith('.zip')) {
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
              AdyenLogs.info_log(`AdyenPayment is defined: ${isAdyenDefined}`);
            }
          }
          deleteDirectoryRecursive(tempUnzipDir);
          if (isAdyenDefined) {
            break;
          }
        }
      } catch (error) {
        AdyenLogs.error_log('Error processing zip file', error);
      } finally {
        // Ensure streams/readers are closed if opened directly within the loop
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
