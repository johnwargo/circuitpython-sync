# CircuitPython Sync

![GitHub](https://img.shields.io/github/license/johnwargo/circuitpython-sync)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johnwargo/circuitpython-sync)
![npm](https://img.shields.io/npm/dw/cpsync)

Node module that synchronizes the files on a connected CircuitPython device to a local project folder.

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
cpsync <device_path> <sync_path>
```

where:

* `<device_path>` is the drive path for a connected CircuitPython device
* `<sync_path>` is the local project folder where you want the module to copy the files from the connected CircuitPython device

Both parameters are required.

If you don't want to install the module globally, you can execute the module on the fly instead using:

``` shell
npx cpsync <device_path> <sync_path>
```

On Windows, the device will appear as a drive with a drive letter assignment. So, assuming it's drive H (your experience may vary but that's how it shows up on my Windows system) you would start the process using the following command:

``` shell
cpsync h: c:\dev\mycoolproject
```

Assuming you'll launch the module from your project folder, use a `.` for the current folder as shown in the following example:

``` shell
cpsync h: .
```

On macOS, it mounts as a drive and you can access it via `/Volumes` folder. On my system, the device mounts as `CIRCUITPY`, so you can start the sync process using: 

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
start cpsync h: .
```

A new window opens as shown in the following figure

![Windows Terminal Example](https://github.com/johnwargo/circuitpython-sync/blob/main/images/figure-01.png)

The CircuitPython device shows up as drive `H:` and the `.` tells the module to copy the files to the current folder.

Every time you change the file contents on the device, the module copies the modified files to the local project folder.

### Getting Help Or Making Changes

Use [GitHub Issues](https://github.com/johnwargo/circuitpython-sync/issues) to get help with this module.

Pull Requests gladly accepted, but only with complete documentation of what the change is, why you made it, and why you think its important to have in the module.

If this code helps you: <a href="https://www.buymeacoffee.com/johnwargo" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>
