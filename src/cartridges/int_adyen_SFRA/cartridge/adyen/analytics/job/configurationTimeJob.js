const File = require('dw/io/File');
const FileReader = require('dw/io/FileReader');
const XMLStreamReader = require('dw/io/XMLStreamReader');
const XMLStreamConstants = require('dw/io/XMLStreamConstants');
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');

const log = Logger.getLogger('ImpexFileProcessor', 'FileIterator');

// eslint-disable-next-line complexity
function hasServiceCredential(servicesXmlFile, serviceIdToFind) {
  if (!servicesXmlFile || !servicesXmlFile.exists() || !serviceIdToFind) {
    log.error(
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

    while (xmlStreamReader.hasNext() && !isFound) {
      if (xmlStreamReader.next() === XMLStreamConstants.START_ELEMENT) {
        const elementName = xmlStreamReader.getLocalName();

        if (elementName === 'service-credential') {
          const currentServiceId = xmlStreamReader.getAttributeValue(
            null,
            'service-credential-id',
          );

          if (currentServiceId === serviceIdToFind) {
            log.info(
              `SUCCESS: Found service credential with ID: '${serviceIdToFind}'`,
            );
            isFound = true;
          }
        }
      }
    }
  } catch (e) {
    log.error(
      `Error parsing services.xml file at ${servicesXmlFile.getFullPath()}: ${e.toString()}`,
    );
    return false;
  } finally {
    if (xmlStreamReader) {
      xmlStreamReader.close();
    }
    if (fileReader) {
      fileReader.close();
    }
  }

  if (!isFound) {
    log.warn(
      `INFO: Service credential '${serviceIdToFind}' was not found in the file.`,
    );
  }

  return isFound;
}

// eslint-disable-next-line complexity
function deleteDirectoryRecursive(directory) {
  if (!directory || !directory.isDirectory()) {
    return;
  }

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
  const processLimit = -1;
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
  let processedCount = 0;

  if (files.empty) {
    return new Status(Status.OK, 'NO_FILES', 'No files found to process.');
  }

  while (
    fileIterator.hasNext() &&
    (processLimit === -1 || processedCount < processLimit)
  ) {
    const currentFile = fileIterator.next();
    if (currentFile.isFile()) {
      const reader = null;
      const lineStream = null;
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
          while (extractedFileIterator.hasNext()) {
            const extractedFile = extractedFileIterator.next();
            if (!extractedFile.isFile()) {
              const servicesFile = new File(
                `${tempUnzipDir.getFullPath()}/${extractedFile.getName()}/services.xml`,
              );
              if (servicesFile.exists()) {
                const isAdyenDefined = hasServiceCredential(
                  servicesFile,
                  'AdyenPayment',
                );
                log.info(`AdyenPayment is defined: ${isAdyenDefined}`);
              }
            }
          }
          deleteDirectoryRecursive(tempUnzipDir);
        }
        processedCount++;
      } catch (e) {
        log.error(
          `Error processing file "${currentFile.getName()}": ${e.message}\n${
            e.stack
          }`,
        );
        // Decide here if you want to stop the job or continue with the next file
        // For robust processing, you might want to move the failed file to an "error" subdirectory.
        // For now, we'll just log and continue.
        // return new Status(Status.ERROR, 'FILE_PROCESS_ERROR', 'Error processing ' + currentFile.getName());
      } finally {
        // Ensure streams/readers are closed if opened directly within the loop
        if (lineStream) {
          lineStream.close();
        }
        if (reader) {
          reader.close();
        }
      }
    }

    // Optional: Move processed file to an archive directory
    // var archiveDir = new File(targetDir.getParent(), targetDir.getName() + '/archive');
    // if (!archiveDir.exists()) archiveDir.mkdirs();
    // currentFile.renameTo(new File(archiveDir, currentFile.getName()));
    // log.info('  Moved to archive: ' + new File(archiveDir, currentFile.getName()).getFullPath());
  }

  log.info(`Successfully processed ${processedCount} files.`);
  return new Status(
    Status.OK,
    'SUCCESS',
    `Files in ${targetDir.getFullPath()} processed.`,
  );
}

module.exports = {
  execute,
};
