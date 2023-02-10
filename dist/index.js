#! /usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const figlet_1 = __importDefault(require("figlet"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chokidar = require('chokidar');
const program = new commander_1.Command();
const logger = require('cli-logger');
const packageDotJSON = require('../package.json');
const error = chalk_1.default.bold.red;
const highlight = chalk_1.default.green;
const warning = chalk_1.default.hex('#FFA500');
const ignoreFiles = [
    'boot_out.txt',
    'BOOTEX.LOG',
    '.metadata_never_index',
    'System Volume Information',
    'test_results.txt',
    '.Trashes'
];
const ignoreFolders = [
    '.fseventsd',
    'System Volume Information',
    '.Trashes'
];
var log = logger();
function initOptions(options) {
    if (options.ignore)
        log.info('Ignore files mode enabled');
    log.level(options.debug ? log.DEBUG : log.INFO);
    log.info('Debug mode is enabled');
}
function ignoreFile(filePath, sourcePath, options) {
    var result = false;
    if (options.ignore) {
        var comparePath = filePath.replace(sourcePath, '');
        if (comparePath.indexOf(path.sep) > -1) {
            var compareFolder = sourcePath + comparePath.split(path.sep)[0];
            if (ignoreFolder(compareFolder, sourcePath, options))
                return true;
        }
        ignoreFiles.forEach((ignoreFile) => {
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
function ignoreFolder(folderPath, sourcePath, options) {
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
function directoryExists(filePath) {
    log.debug(`Validating ${filePath}`);
    if (fs.existsSync(filePath)) {
        try {
            return fs.lstatSync(filePath).isDirectory();
        }
        catch (err) {
            log.error(error(`Error accessing directory properties: ${err}`));
        }
    }
    return false;
}
function copyFile(sourceFile, sourcePath, destPath) {
    var targetFile = sourceFile.replace(sourcePath, '');
    targetFile = path.join(destPath, targetFile);
    log.debug(`Copying ${sourceFile} to ${targetFile}`);
    try {
        fs.copyFileSync(sourceFile, targetFile);
    }
    catch (err) {
        log.error(error(`Error copying file: ${err}`));
    }
}
function deleteFile(deleteFile, sourcePath, destPath) {
    var targetFile = deleteFile.replace(sourcePath, '');
    targetFile = path.join(destPath, targetFile);
    log.debug(`Deleting ${targetFile}`);
    try {
        fs.unlinkSync(targetFile);
    }
    catch (err) {
        log.error(error(`Error deleting file: ${err}`));
    }
}
function makeDirectory(sourceDir, sourcePath, destPath) {
    var targetDir = sourceDir.replace(sourcePath, '');
    targetDir = path.join(destPath, targetDir);
    if (directoryExists(targetDir)) {
        log.debug(`Directory ${targetDir} already exists`);
        return;
    }
    log.debug(`Creating directory ${targetDir}`);
    try {
        fs.mkdirSync(targetDir);
    }
    catch (err) {
        log.error(error(`Error creating directory: ${err}`));
    }
}
function deleteDirectory(deleteDir, sourcePath, destPath) {
    var targetDir = deleteDir.replace(sourcePath, '');
    targetDir = path.join(destPath, targetDir);
    log.debug(`Deleting directory ${targetDir}`);
    try {
        fs.rmdirSync(targetDir);
    }
    catch (err) {
        log.error(error(`Error deleting directory: ${err}`));
    }
}
function displayConfig(devicePath, syncPath, options) {
    log.info(`Device Path: ${devicePath}`);
    log.info(`Sync Path: ${syncPath}`);
    log.info(`Ignore Files: ${options.ignore}`);
    log.info(`Debug Mode: ${options.debug}`);
    log.info(' ');
}
function validateArguments(devicePath, syncPath) {
    var resultStr = "";
    var validationStatus = true;
    if (!directoryExists(devicePath)) {
        resultStr += `The device path ${devicePath} does not exist or is not a directory.\n`;
        validationStatus = false;
    }
    if (!directoryExists(syncPath)) {
        resultStr += `The sync path ${syncPath} does not exist or is not a directory.\n`;
        validationStatus = false;
    }
    if (!validationStatus) {
        log.error("\nArgument Error(s):\n");
        log.error(error(resultStr));
    }
    return validationStatus;
}
async function watchFolder(devicePath, syncPath, options) {
    const watcher = chokidar.watch(devicePath, { persistent: true });
    watcher
        .on('add', (eventPath) => {
        if (!ignoreFile(eventPath, devicePath, options)) {
            log.info(`Adding ${eventPath}`);
            copyFile(eventPath, devicePath, syncPath);
        }
        else {
            log.info(warning(`Ignoring ${eventPath}`));
        }
    })
        .on('change', (eventPath) => {
        if (!ignoreFile(eventPath, devicePath, options)) {
            log.info(`File ${eventPath} updated`);
            copyFile(eventPath, devicePath, syncPath);
        }
        else {
            log.info(warning(`Ignoring change to ${eventPath}`));
        }
    })
        .on('unlink', (eventPath) => {
        if (!ignoreFile(eventPath, devicePath, options)) {
            log.info(`File ${eventPath} has been removed`);
            deleteFile(eventPath, devicePath, syncPath);
        }
        else {
            log.info(warning(`Ignoring ${eventPath} deletion`));
        }
    })
        .on('addDir', (eventPath) => {
        if (path.basename(eventPath) == '.')
            return;
        if (!ignoreFolder(eventPath, devicePath, options)) {
            log.info(`Folder ${eventPath} has been added`);
            makeDirectory(eventPath, devicePath, syncPath);
        }
        else {
            log.info(warning(`Ignoring ${eventPath} directory`));
        }
    })
        .on('unlinkDir', (path) => {
        if (!ignoreFolder(path, devicePath, options)) {
            log.info(`Folder ${path} has been removed`);
            deleteDirectory(path, devicePath, syncPath);
        }
        else {
            log.info(warning(`Ignoring ${path} deletion`));
        }
    })
        .on('error', (errStr) => log.error(error(`Watcher error: ${errStr}`)))
        .on('ready', () => log.info(warning('Watching folder for changes')));
}
log.info(figlet_1.default.textSync(packageDotJSON.name));
log.info(highlight(`\nVersion: ${packageDotJSON.version}, by John M. Wargo\n`));
program
    .name(packageDotJSON.name)
    .version(packageDotJSON.version)
    .description("Synchronize files from a CircuitPython device to a local folder during development")
    .option('-d, --debug', 'Output extra information to the console', false)
    .option('-i, --ignore', 'Ignore non-project files', false)
    .argument('<devicePath>', 'File path to the Circuit Python device')
    .argument('<destFolder>', 'Destination (local) folder')
    .action((devicePath, destFolder) => {
    const options = program.opts();
    if (destFolder === '.')
        destFolder = process.cwd();
    initOptions(options);
    if (validateArguments(devicePath, destFolder)) {
        log.debug("Configuration is valid");
        displayConfig(devicePath, destFolder, options);
        watchFolder(devicePath, destFolder, options);
    }
    else {
        log.debug("Configuration is invalid");
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=index.js.map