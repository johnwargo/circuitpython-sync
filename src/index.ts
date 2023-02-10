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

function initOptions(options: any) {
  if (options.ignore) log.info('Ignore files mode enabled');
  log.level(options.debug ? log.DEBUG : log.INFO);
  log.info('Debug mode is enabled');
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
      if (result) {
        return;
      }
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
      if (result) {
        return;
      }
      if (comparePath.startsWith(ignoreFolder)) {
        result = true;
      }
    });
  }
  return result;
}

function directoryExists(filePath: string): boolean {
  log.debug(`Validating ${filePath}`);
  if (fs.existsSync(filePath)) {
    try {
      // https://stackoverflow.com/questions/15630770/node-js-check-if-path-is-file-or-directory
      // Check to see if it's a folder
      return fs.lstatSync(filePath).isDirectory();
    } catch (err) {
      log.error(error(`Error accessing directory properties: ${err}`));
    }
  }
  return false;
}

function copyFile(sourceFile: string, sourcePath: string, destPath: string) {
  // strip the device path from the file path
  var targetFile = sourceFile.replace(sourcePath, '');
  targetFile = path.join(destPath, targetFile);

  log.debug(`Copying ${sourceFile} to ${targetFile}`);
  try {
    fs.copyFileSync(sourceFile, targetFile);
  } catch (err) {
    log.error(error(`Error copying file: ${err}`));
  }
}

function deleteFile(deleteFile: string, sourcePath: string, destPath: string) {
  var targetFile = deleteFile.replace(sourcePath, destPath);
  log.debug(`Deleting ${targetFile}`);
  try {
    fs.unlinkSync(targetFile);
  } catch (err) {
    log.error(error(`Error deleting file: ${err}`));
  }
}

function makeDirectory(sourceDir: string, sourcePath: string, destPath: string) {
  // var targetDir = sourceDir.replace(sourcePath, path.resolve(destPath));

  // strip the device path from the file path
  var targetDir = sourceDir.replace(sourcePath, '');
  targetDir = path.join(destPath, targetDir);

  if (directoryExists(targetDir)) {
    log.debug(`Directory ${targetDir} already exists`);
    return;
  }
  log.debug(`Creating directory ${targetDir}`);
  try {
    fs.mkdirSync(targetDir);
  } catch (err) {
    log.error(error(`Error creating directory: ${err}`));
  }
}

function deleteDirectory(deleteDir: string, sourcePath: string, destPath: string) {
  var targetDir = deleteDir.replace(sourcePath, destPath);
  log.debug(`Deleting directory ${targetDir}`);
  try {
    fs.rmdirSync(targetDir);
  } catch (err) {
    log.error(error(`Error deleting directory: ${err}`));
  }
}

// function displayConfig(devicePath: string, syncPath: string, delayVal: number) {
function displayConfig(devicePath: string, syncPath: string, options: any) {
  log.info(`Device Path: ${devicePath}`);
  log.info(`Sync Path: ${syncPath}`);
  log.info(`Ignore Files: ${options.ignore}`);
  log.info(`Debug Mode: ${options.debug}`);
  // if (delayVal > 0) {
  //   log.info(`Delay: ${delayVal} seconds\n`);
  // }
  log.info(' ');
}

// function validateArguments(devicePath: string, syncPath: string, delayVal: string): boolean {
function validateArguments(devicePath: string, syncPath: string): boolean {
  var resultStr: String = "";
  var validationStatus: boolean = true;
  if (!directoryExists(devicePath)) {
    resultStr += `The device path ${devicePath} does not exist or is not a directory.\n`;
    validationStatus = false;
  }

  if (!directoryExists(syncPath)) {
    resultStr += `The sync path ${syncPath} does not exist or is not a directory.\n`;
    validationStatus = false;
  }

  // //@ts-ignore
  // if (isNaN(delayVal)) {
  //   resultStr += `The delay value ${delayVal} is not a number.\n`;
  //   validationStatus = false;
  // }

  if (!validationStatus) {
    log.error("\nArgument Error(s):\n");
    log.error(error(resultStr));
  }
  return validationStatus;
}

// async function watchFolder(devicePath: string, syncPath: string, delayVal: number) {
async function watchFolder(devicePath: string, syncPath: string, options: any) {
  const watcher = chokidar.watch(devicePath, { persistent: true });
  watcher
    .on('add', (eventPath: string) => {
      if (!ignoreFile(eventPath, devicePath, options)) {
        log.info(`Adding ${eventPath}`);
        copyFile(eventPath, devicePath, syncPath);
      } else {
        log.info(warning(`Ignoring ${eventPath}`));
      }
    })
    .on('change', (eventPath: string) => {
      if (!ignoreFile(eventPath, devicePath, options)) {
        log.info(`File ${eventPath} updated`);
        copyFile(eventPath, devicePath, syncPath);
      } else {
        log.info(warning(`Ignoring change to ${eventPath}`));
      }
    })
    .on('unlink', (eventPath: string) => {
      if (!ignoreFile(eventPath, devicePath, options)) {
        log.info(`File ${eventPath} has been removed`);
        deleteFile(eventPath, devicePath, syncPath);
      } else {
        log.info(warning(`Ignoring ${eventPath} deletion`));
      }
    })
    .on('addDir', (eventPath: string) => {
      // if it's `.` ignore it
      if (path.basename(eventPath) == '.') return;

      if (!ignoreFolder(eventPath, devicePath, options)) {
        log.info(`Folder ${eventPath} has been added`);
        makeDirectory(eventPath, devicePath, syncPath);
      } else {
        log.info(warning(`Ignoring ${eventPath} directory`));
      }
    })
    .on('unlinkDir', (path: string) => {
      if (!ignoreFolder(path, devicePath, options)) {
        log.info(`Folder ${path} has been removed`);
        deleteDirectory(path, devicePath, syncPath);
      } else {
        log.info(warning(`Ignoring ${path} deletion`));
      }
    })
    .on('error', (errStr: string) => log.error(error(`Watcher error: ${errStr}`)))
    .on('ready', () => log.info(warning('Watching folder for changes')));
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
  // .argument('[delayVal]', 'Number of seconds after a file change to wait before syncing')
  // .action((devicePath: string, syncPath: string, delayVal: string = '0') => {
  .action((devicePath: string, destFolder: string) => {
    const options = program.opts();
    // Fix our dest folder if it's the current directory
    if (destFolder === '.') destFolder = process.cwd();
    // Initialize 'stuff'
    initOptions(options);
    // if (validateArguments(devicePath, syncPath, delayVal)) {
    if (validateArguments(devicePath, destFolder)) {
      log.debug("Configuration is valid");
      // var delaySeconds = Math.abs(Number(delayVal));
      // displayConfig(devicePath, syncPath, delaySeconds);
      // watchFolder(devicePath, syncPath, delaySeconds);
      displayConfig(devicePath, destFolder, options);
      watchFolder(devicePath, destFolder, options);
    } else {
      log.debug("Configuration is invalid");
      process.exit(1);
    }
  });

program.parse();
