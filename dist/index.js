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
function getTargetPath(sourcePath, destPath, eventPath) {
    var result = eventPath.replace(sourcePath, '');
    result = path.join(destPath, result);
    return result;
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
            if (result)
                return;
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
            if (result)
                return;
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
function copyFile(eventPath, sourcePath, destPath) {
    var targetPath = getTargetPath(sourcePath, destPath, eventPath);
    log.debug(`Copying ${eventPath} to ${targetPath}`);
    try {
        fs.copyFileSync(eventPath, targetPath);
    }
    catch (err) {
        log.error(error(`Error copying file: ${err}`));
    }
}
function deleteFile(eventPath, sourcePath, destPath) {
    var targetPath = getTargetPath(sourcePath, destPath, eventPath);
    log.debug(`Deleting ${targetPath}`);
    try {
        fs.unlinkSync(targetPath);
    }
    catch (err) {
        log.error(error(`Error deleting file: ${err}`));
    }
}
function makeDirectory(eventPath, sourcePath, destPath) {
    var targetPath = getTargetPath(sourcePath, destPath, eventPath);
    if (directoryExists(targetPath)) {
        log.debug(`Directory ${targetPath} already exists`);
        return;
    }
    log.debug(`Creating directory ${targetPath}`);
    try {
        fs.mkdirSync(targetPath);
    }
    catch (err) {
        log.error(error(`Error creating directory: ${err}`));
    }
}
function deleteDirectory(eventPath, sourcePath, destPath) {
    var targetPath = getTargetPath(sourcePath, destPath, eventPath);
    log.debug(`Deleting directory ${targetPath}`);
    try {
        fs.rmdirSync(targetPath);
    }
    catch (err) {
        log.error(error(`Error deleting directory: ${err}`));
    }
}
function displayConfig(sourcePath, destPath, options) {
    log.info(`Device Path: ${sourcePath}`);
    log.info(`Sync Path: ${destPath}`);
    log.info(`Ignore Files: ${options.ignore ? 'Yes' : 'No'}`);
    log.info(`Debug Mode: ${options.debug ? 'Yes' : 'No'}\n`);
}
function validateArguments(sourcePath, destPath) {
    var resultStr = "";
    var validationStatus = true;
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
async function watchFolder(sourcePath, destPath, options) {
    const watcher = chokidar.watch(sourcePath, { persistent: true });
    watcher
        .on('add', (eventPath) => {
        if (!ignoreFile(eventPath, sourcePath, options)) {
            log.info(`Adding ${eventPath}`);
            copyFile(eventPath, sourcePath, destPath);
        }
        else {
            log.info(warning(`Ignoring ${eventPath}`));
        }
    })
        .on('change', (eventPath) => {
        if (!ignoreFile(eventPath, sourcePath, options)) {
            log.info(`File ${eventPath} updated`);
            copyFile(eventPath, sourcePath, destPath);
        }
        else {
            log.info(warning(`Ignoring change to ${eventPath}`));
        }
    })
        .on('unlink', (eventPath) => {
        if (!ignoreFile(eventPath, sourcePath, options)) {
            log.info(`File ${eventPath} has been removed`);
            deleteFile(eventPath, sourcePath, destPath);
        }
        else {
            log.info(warning(`Ignoring ${eventPath} deletion`));
        }
    })
        .on('addDir', (eventPath) => {
        if (path.basename(eventPath) == '.')
            return;
        if (!ignoreFolder(eventPath, sourcePath, options)) {
            log.info(`Folder ${eventPath} has been added`);
            makeDirectory(eventPath, sourcePath, destPath);
        }
        else {
            log.info(warning(`Ignoring ${eventPath} directory`));
        }
    })
        .on('unlinkDir', (path) => {
        if (!ignoreFolder(path, sourcePath, options)) {
            log.info(`Folder ${path} has been removed`);
            deleteDirectory(path, sourcePath, destPath);
        }
        else {
            log.info(warning(`Ignoring ${path} deletion`));
        }
    })
        .on('error', (errStr) => log.error(error(`Watcher error: ${errStr}`)))
        .on('ready', () => log.info(highlight('Watching folder for changes')));
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
    log.level(options.debug ? log.DEBUG : log.INFO);
    if (destFolder === '.')
        destFolder = process.cwd();
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