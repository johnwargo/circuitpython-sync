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
var options: any;

function initOptions() {
  if (options.ignore) log.info('Ignore files mode enabled');
  log.level(options.debug ? log.DEBUG : log.INFO);
  log.info('Debug mode is enabled');
}

function ignoreFile(filePath: string): boolean {
  var result = false;
  if (options.ignore) {
    ignoreFiles.forEach((ignoreFile) => {
      if (path.basename(filePath) == ignoreFile) {
        result = true;
        return;
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
  var targetFile = sourceFile.replace(sourcePath, destPath);
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
  var targetDir = sourceDir.replace(sourcePath, destPath);
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
function displayConfig(devicePath: string, syncPath: string) {
  log.info(`Device Path: ${devicePath}`);
  log.info(`Sync Path: ${syncPath}`);
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
async function watchFolder(devicePath: string, syncPath: string) {
  const watcher = chokidar.watch(devicePath, { persistent: true });
  watcher
    .on('add', (path: string) => {
      if (!ignoreFile(path)) {
        log.info(`Adding ${path}`);
        copyFile(path, devicePath, syncPath);
      } else {
        log.info(warning(`Ignoring ${path}`));
      }
    })
    .on('change', (path: string) => {
      if (!ignoreFile(path)) {
        log.info(`File ${path} updated`);
        copyFile(path, devicePath, syncPath);
      } else {
        log.info(warning(`Ignoring change to ${path}`));
      }
    })
    .on('unlink', (path: string) => {
      log.info(`File ${path} has been removed`);
      deleteFile(path, devicePath, syncPath);
    })
    .on('addDir', (path: string) => {
      log.info(`Directory ${path} has been added`);
      makeDirectory(path, devicePath, syncPath);
    })
    .on('unlinkDir', (path: string) => {
      log.info(`Directory ${path} has been removed`);
      deleteDirectory(path, devicePath, syncPath);
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
    options = program.opts();
    initOptions();
    // log.info(`\nExecuting cpsync ${devicePath} ${syncPath} ${delayVal}`);
    log.info(`Executing cpsync ${devicePath} ${destFolder}`);
    // if (validateArguments(devicePath, syncPath, delayVal)) {
    if (validateArguments(devicePath, destFolder)) {
      log.debug("Configuration is valid");
      // var delaySeconds = Math.abs(Number(delayVal));
      // displayConfig(devicePath, syncPath, delaySeconds);
      // watchFolder(devicePath, syncPath, delaySeconds);
      displayConfig(devicePath, destFolder);
      watchFolder(devicePath, destFolder);
    } else {
      log.debug("Configuration is invalid");
      process.exit(1);
    }
  });

program.parse();
