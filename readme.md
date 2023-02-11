# CircuitPython Sync

![GitHub License](https://img.shields.io/github/license/johnwargo/circuitpython-sync)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johnwargo/circuitpython-sync)
![GitHub Issues](https://img.shields.io/github/issues/johnwargo/circuitpython-sync)
![npm Downloads](https://img.shields.io/npm/dw/cpsync)

Node module that synchronizes the files on a connected CircuitPython device to a local project folder. It provides a one-way sync from the CircuitPython device to the local project folder. Technically it does a copy rather than a sync, but if I included copy in the name, it would be `cpcopy` or `cp-copy` which looks like a merger of the Linux copy command `cp` plus the DOS copy command `copy` and that would be confusing.

When you work with a CircuitPython device, you generally read and write executable Python files directly from/to the device; there's even a Python editor called [Mu](https://codewith.mu/) built just for this use case. 

Many more experienced developers work with a local project folder then transfer the source code to a connected device, as you do when working with Arduino and other platforms. This module allows you to do both:

1. Read/write source code from/to a connected Circuit Python device using Mu or other editors (even Visual Studio Code plugins). 
2. Automatically copy source files from the device to a local project folder whenever the change on the device. 

Here's how it works:

1. Create a local Python project with all the other files you need (like a `readme.md` file, or a `.gitignore`).
2. Connect a CircuitPython device to your computer.
3. Open a terminal window or command prompt and execute the module specifying the CircuitPython drive path and local project path as command line arguments.
4. The module copies all of the files from the connected CircuitPython device to the specified project folder.
5. Open any editor you want and edit the Python source code files (and any other file) on the connected device. 
6. When you save any modified files on the connected CircuitPython device, the module automatically copies the modified file(s) to the project folder.

[See the module in action on YouTube](https://www.youtube.com/watch?v=QkF4pEy4YIY)

## Installation

To install globally, open a command prompt or terminal window and execute the following command:

``` shell
npm install -g cpsync
```

You'll want to install globally since CircuitPython projects don't generally use Node modules (like this one) so a `package.json` file and `node_modules` folder will look weird in your project folder.

## Usage

To start the sync process, in a terminal window execute the following command:

``` shell
cpsync <device_path> <sync_path> [-d | --debug] [-i | --ignore]
```

Arguments:

* `<device_path>` is the drive path for a connected CircuitPython device
* `<sync_path>` is the local project folder where you want the module to copy the files from the connected CircuitPython device

Both command arguments are required (indicated by angle brackets `<` and `>`). Square brackets (`[` and `]`)indicate optional parameters.

Options:

* `-d` or `--debug` enables debug mode which writes additional information to the console as the module executes
* `-i` or `--ignore` instructs the module to ignore the internal files typically found on a CircuitPython device.

A CircuitPython device hosts several internal use or housekeeping files that you don't need copied into your local project. When you enable ignore mode (by passing the `-i` option on the command line), the module ignores the following when synchronizing files from the CircuitPython device to your local project folder:

``` typescript
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
```

If you find other device-side housekeeping files, let me know and I'll update the ignore arrays in the module.

## Examples

If you don't want to install the module globally, you can execute the module on the fly instead using:

``` shell
npx cpsync <device_path> <sync_path>
```

On Windows, the device appears as a drive with a drive letter assignment. So, assuming it's drive H (your experience may vary but that's how it shows up on my Windows system) start the module with the following command:

``` shell
cpsync h: c:\dev\mycoolproject
```

Assuming you'll launch the module from your project folder, use a `.` for the current folder as shown in the following example:

``` shell
cpsync h: .
```

On macOS, it mounts as a drive and you can access it via `/Volumes` folder. On my system, the device mounts as `CIRCUITPY`, so start the sync process using: 

``` shell
cpsync /Volumes/CIRCUITPY .
```

On Windows I like to execute the module from the terminal prompt in Visual Studio Code, but keep the terminal available to execute other commands, so I start the module using the following:

``` shell
start cpsync <device_path> <sync_path>
```

This starts the module in a new/separate terminal window, leaving the Visual Studio terminal available to me to execute additional commands.  

For example, if I execute the following command:

``` shell
start cpsync h: . -i
```

A new window opens as shown in the following figure

![Windows Terminal Example](https://github.com/johnwargo/circuitpython-sync/blob/main/images/figure-01.png)

The CircuitPython device shows up as drive `H:` and the `.` tells the module to copy the files to the current folder.

Every time you change the file contents on the device, the module copies the modified files to the local project folder.

### Getting Help Or Making Changes

Use [GitHub Issues](https://github.com/johnwargo/circuitpython-sync/issues) to get help with this module.

Pull Requests gladly accepted, but only with complete documentation of what the change is, why you made it, and why you think its important to have in the module.

If this code helps you: <a href="https://www.buymeacoffee.com/johnwargo" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
