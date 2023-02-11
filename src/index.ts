#! /usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import figlet from "figlet";
import * as fs from "fs";
import * as path from "path";

const chokidar = require('chokidar');
const program = new Command();
const logger = require('cli-logger');

// Load the package.json file as an object we can pull properties from 
const packageDotJSON = require('../package.json');

const error = chalk.bold.red;
const highlight = chalk.green;
const warning = chalk.hex('#FFA500');

const ignoreFiles = [
  'boot_out.txt',
  'BOOTEX.LOG',
  '.metadata_never_index',
  'System Volume Information',
  'test_results.txt',
  '.Trashes'
] as const;

const ignoreFolders = [
  '.fseventsd',
  'System Volume Information',
  '.Trashes'
] as const;

var log = logger();

function getTargetPath(sourcePath: string, destPath: string, eventPath: string): string {
  var result = eventPath.replace(sourcePath, '');
  result = path.join(destPath, result);
  return result;
}

function ignoreFile(filePath: string, sourcePath: string, options: any): boolean {
  var result = false;
  if (options.ignore) {
    // strip the device path from the file path
    var comparePath = filePath.replace(sourcePath, '');
    // do we have a delimiter?
    if (comparePath.indexOf(path.sep) > -1) {
      // then we have a directory in the path, check it out
      var compareFolder = sourcePath + comparePath.split(path.sep)[0];
      if (ignoreFolder(compareFolder, sourcePath, options)) return true;
    }

    ignoreFiles.forEach((ignoreFile) => {
      // https://masteringjs.io/tutorials/fundamentals/foreach-break
      if (result) return;
      if (path.basename(filePath) == ignoreFile) {
        result = true;
      }
    });
  }
  return result;
}

function ignoreFolder(folderPath: string, sourcePath: string, options: any): boolean {
  var result = false;
  if (options.ignore) {
    var comparePath = folderPath.replace(sourcePath, '');
    ignoreFolders.forEach((ignoreFolder) => {
      if (result) return;
      if (comparePath.startsWith(ignoreFolder)) {
        result = true;
      }
    });
  }
  return result;
}

function directoryExists(filePath: string): boolean {
  // https://stackoverflow.com/questions/15630770/node-js-check-if-path-is-file-or-directory
  log.debug(`Validating ${filePath}`);
  if (fs.existsSync(filePath)) {
    try {
      // Check to see if it's a folder
      return fs.lstatSync(filePath).isDirectory();
    } catch (err) {
      log.error(error(`Error accessing directory properties: ${err}`));
    }
  }
  return false;
}

function copyFile(eventPath: string, sourcePath: string, destPath: string) {
  var targetPath = getTargetPath(sourcePath, destPath, eventPath);
  log.debug(`Copying ${eventPath} to ${targetPath}`);
  try {
    fs.copyFileSync(eventPath, targetPath);
  } catch (err) {
    log.error(error(`Error copying file: ${err}`));
  }
}

function deleteFile(eventPath: string, sourcePath: string, destPath: string) {
  var targetPath = getTargetPath(sourcePath, destPath, eventPath);
  log.debug(`Deleting ${targetPath}`);
  try {
    fs.unlinkSync(targetPath);
  } catch (err) {
    log.error(error(`Error deleting file: ${err}`));
  }
}

function makeDirectory(eventPath: string, sourcePath: string, destPath: string) {
  var targetPath = getTargetPath(sourcePath, destPath, eventPath);
  if (directoryExists(targetPath)) {
    log.debug(`Directory ${targetPath} already exists`);
    return;
  }
  log.debug(`Creating directory ${targetPath}`);
  try {
    fs.mkdirSync(targetPath);
  } catch (err) {
    log.error(error(`Error creating directory: ${err}`));
  }
}

function deleteDirectory(eventPath: string, sourcePath: string, destPath: string) {
  var targetPath = getTargetPath(sourcePath, destPath, eventPath);
  log.debug(`Deleting directory ${targetPath}`);
  try {
    fs.rmdirSync(targetPath);
  } catch (err) {
    log.error(error(`Error deleting directory: ${err}`));
  }
}

function displayConfig(sourcePath: string, destPath: string, options: any) {
  log.info(`Device Path: ${sourcePath}`);
  log.info(`Sync Path: ${destPath}`);
  log.info(`Ignore Files: ${options.ignore ? 'Yes' : 'No'}`);
  log.info(`Debug Mode: ${options.debug ? 'Yes' : 'No'}\n`);  
}

function validateArguments(sourcePath: string, destPath: string): boolean {
  var resultStr: String = "";
  var validationStatus: boolean = true;
  if (!directoryExists(sourcePath)) {
    resultStr += `The device path ${sourcePath} does not exist or is not a directory.\n`;
    validationStatus = false;
  }

  if (!directoryExists(destPath)) {
    resultStr += `The sync path ${destPath} does not exist or is not a directory.\n`;
    validationStatus = false;
  }

  if (!validationStatus) {
    log.error("\nArgument Error(s):\n");
    log.error(error(resultStr));
  }
  return validationStatus;
}

async function watchFolder(sourcePath: string, destPath: string, options: any) {
  const watcher = chokidar.watch(sourcePath, { persistent: true });
  watcher
    .on('add', (eventPath: string) => {
      if (!ignoreFile(eventPath, sourcePath, options)) {
        log.info(`Adding ${eventPath}`);
        copyFile(eventPath, sourcePath, destPath);
      } else {
        log.info(warning(`Ignoring ${eventPath}`));
      }
    })
    .on('change', (eventPath: string) => {
      if (!ignoreFile(eventPath, sourcePath, options)) {
        log.info(`File ${eventPath} updated`);
        copyFile(eventPath, sourcePath, destPath);
      } else {
        log.info(warning(`Ignoring change to ${eventPath}`));
      }
    })
    .on('unlink', (eventPath: string) => {
      if (!ignoreFile(eventPath, sourcePath, options)) {
        log.info(`File ${eventPath} has been removed`);
        deleteFile(eventPath, sourcePath, destPath);
      } else {
        log.info(warning(`Ignoring ${eventPath} deletion`));
      }
    })
    .on('addDir', (eventPath: string) => {
      // if it's `.` ignore it
      if (path.basename(eventPath) == '.') return;

      if (!ignoreFolder(eventPath, sourcePath, options)) {
        log.info(`Folder ${eventPath} has been added`);
        makeDirectory(eventPath, sourcePath, destPath);
      } else {
        log.info(warning(`Ignoring ${eventPath} directory`));
      }
    })
    .on('unlinkDir', (path: string) => {
      if (!ignoreFolder(path, sourcePath, options)) {
        log.info(`Folder ${path} has been removed`);
        deleteDirectory(path, sourcePath, destPath);
      } else {
        log.info(warning(`Ignoring ${path} deletion`));
      }
    })
    .on('error', (errStr: string) => log.error(error(`Watcher error: ${errStr}`)))
    .on('ready', () => log.info(highlight('Watching folder for changes')));
}

log.info(figlet.textSync(packageDotJSON.name));
log.info(highlight(`\nVersion: ${packageDotJSON.version}, by John M. Wargo\n`));

program
  .name(packageDotJSON.name)
  .version(packageDotJSON.version)
  .description("Synchronize files from a CircuitPython device to a local folder during development")
  .option('-d, --debug', 'Output extra information to the console', false)
  .option('-i, --ignore', 'Ignore non-project files', false)
  .argument('<devicePath>', 'File path to the Circuit Python device')
  .argument('<destFolder>', 'Destination (local) folder')
  .action((devicePath: string, destFolder: string) => {
    const options = program.opts();
    log.level(options.debug ? log.DEBUG : log.INFO);
    // Fix our dest folder if it's the current directory
    if (destFolder === '.') destFolder = process.cwd();
    if (validateArguments(devicePath, destFolder)) {
      log.debug("Configuration is valid");
      displayConfig(devicePath, destFolder, options);
      watchFolder(devicePath, destFolder, options);
    } else {
      log.debug("Configuration is invalid");
      process.exit(1);
    }
  });

program.parse();
