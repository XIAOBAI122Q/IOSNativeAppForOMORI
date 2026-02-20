"use strict";

window._MEMO_PATHS = {}

function replaceSpecialSymbols(s) {
    const memoized = _MEMO_PATHS[s];
    if (memoized != undefined) {
        return memoized;
    }
    if (s == null || s == undefined) {
        return s;
    }
    try {
        s = decodeURIComponent(s)
    } catch (e) {
    }

    const result = s.replaceAll('!', '_PIDOR_').replaceAll('[', '_SUPER_').replaceAll(']', '_PEDIK_').replaceAll('$', '_SEMENCUM_').replaceAll('%', '_RAZRABI_PIDORASI').replaceAll('(', '_SOSI_').replaceAll(')', '_BEBRA_');
    _MEMO_PATHS[s] = result;
    return result
}

function require(libname) {
    if (!libname.startsWith('/')) {
        libname = `/${libname}`;
    }

    if (require.libs[libname] !== undefined) {
        return require.libs[libname];
    } else {
        if (libname[0] !== "/" && require.dirstack.length > 0) {
            // Solve relative path
            libname = require.libs.path.join(require.dirstack[require.dirstack.length - 1], libname);
        }
        libname = require.libs.path._solve_dots(libname);

        if (require.libs[libname] !== undefined) {
            // Try to load cached version again, this time using expanded path
            return require.libs[libname];
        }

        console.log(`First time load ${libname}`);

        // Try to load the library .js file
        var dirpath = require.libs.path.dirname(libname);
        var xhr = new XMLHttpRequest();

        let extended_name = libname.endsWith(".js") ? libname : (libname + ".js");
        if (libname.startsWith('js-yaml/')) {
            extended_name = "js/libs/js-yaml-master/lib/" + libname + '.js';
        }
        if (extended_name == "lib/js-yaml.js" || extended_name == "js/libs/js-yaml-master.js") {
            extended_name = "js/libs/js-yaml-master/lib/js-yaml.js";
        }

        console.log(`extended name = ${extended_name}`);
        xhr.open("GET", extended_name, false);
        let status;
        try {
            xhr.send();
            status = xhr.status;
        } catch (e) {
            if (e.message.startsWith("Failed to execute 'send'")) {
                status = 404;
            } else {
                throw e;
            }
        }
        if (status === 404) {
            dirpath = libname;
            xhr = new XMLHttpRequest();
            xhr.open("GET", require.libs.path.join(libname, "index.js"), false);
            try {
                xhr.send();
                status = xhr.status;
            } catch (e) {
                if (e.message.startsWith("Failed to execute 'send'")) {
                    status = 404;
                } else {
                    throw e;
                }
            }
        }
        if (status !== 200 && status !== 0) {
            throw `Couldn't find the ${libname} library`;
        }

        // Execute the library in a semi-isolated scope
        require.dirstack.push(dirpath);
        try {
            require.libs[libname] = {};
            (function (text) {
                // Module scope
                var module = { exports: {} };
                eval(text);
                require.libs[libname] = module.exports;
            })(xhr.responseText);

        } catch (e) {
            console.log(`Loading ${libname} failed`);
            throw e;

        } finally {
            require.dirstack.pop();
        }

        return require.libs[libname];
    }
}

require.dirstack = [process.env.ROOT_PATH];

class Buffer extends Uint8Array {
    constructor(arg) {
        super(arg);
    }
    toString() {
        return new TextDecoder().decode(this);
    }

    static concat(rest) {
        if (rest.length == 0)
            return new Buffer();

        let total = 0;
        for (let i = 0; i < rest.length; i++) {
            total += rest[i].length;
        }
        let buffer = new Buffer(total);
        let i = 0;
        for (let argc = 0; argc < rest.length; argc++) {
            for (let j = 0; j < rest[argc].length; j++) {
                buffer[i] = rest[argc][j];
                i++;
            }
        }
        return buffer;
    }
}

require.libs = {};

require.libs.path = {
    delimiter: "/",

    dirname: function (s) {
        let delimiter = require.libs["path"].delimiter;

        let arr = s.split(delimiter);
        let out = arr.slice(0, arr.length - 1);
        return out.join("/");
    },

    join: function (...rest) {
        let delimiter = require.libs["path"].delimiter;

        let path = rest.join(delimiter);
        let s = "";
        for (let i = 0; i < path.length; i++) {
            while (i !== 0 && i < path.length && path[i - 1] === "/" && path[i] === "/")
                i++;
            if (i < path.length)
                s += path[i];
        }

        return s;
    },

    extname: function (path) {
        let arr = path.split(".");
        return "." + arr[arr.length - 1];
    },

    basename: function (path, ext) {
        let delimiter = require.libs["path"].delimiter;

        if (ext !== undefined) {
            while (ext[0] === ".") {
                ext = ext.substr(1);
            }
            if (path.endsWith("." + ext)) {
                path = path.substr(0, path.length - ext.length - 1);
            }
        }
        let arr = path.split(delimiter);
        return arr[arr.length - 1];
    },

    _solve_dots: function (path) {
        let delimiter = require.libs["path"].delimiter;

        let arr = path.split(delimiter);
        let new_arr = [];

        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === "..") {
                new_arr.pop();
            } else if (arr[i] === ".") {
                // Do nothing
            } else if (arr[i] === "") {
                // Also do nothing
            } else {
                new_arr.push(arr[i]);
            }
        }
        return new_arr.join(delimiter);
    }
};

function capitalizeImpl(s) {
    if (s.length == 0) {
        return ""
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
}
window.ALT_CACHE = {}

require.libs.fs = {
    cachedAlternativeName: function (path) {
        if (path == null || path == undefined) {
            return path;
        }
        if (ALT_CACHE[path] != undefined) {
            return ALT_CACHE[path];
        }

        if (require.libs.fs.existsSync(path)) {
            return path;
        }

        const alt = require.libs.fs.findAlternativeName(path);
        ALT_CACHE[path] = alt;
        return alt;
    },

    findAlternativeName: function (path) {
        const dirname = require.libs.path.dirname(path);
        const basename = require.libs.path.basename(path);

        const listing = require.libs.fs.readdirSync(dirname);
        for (const listingFile of listing) {
            if (listingFile.toLowerCase() == basename.toLowerCase()) {
                const alt = require.libs.path.join(dirname, listingFile);
                console.log(`tried to access ${path}: not found, found alternative: ${alt}`) //Remove in release
                return alt;
            }
        }

        console.log(`tried to access ${path}: not found, alternative name was not found too!`) //Remove in release

        return null;
    },

    readFileSync: function (path, options = {}) {
        let tmparr = require.libs.path._solve_dots(path).split("/");
        if (tmparr[tmparr.length - 2] === "save") {
            console.log("Using NativeFunctions.readSaveFileUTF8");
            let res = NativeFunctions.readSaveFileUTF8(path);
            if (res === null || res === undefined) {
                throw "Server returned status code 404";
            }
            return res;
        }

        if (typeof (path) !== "string") {
            throw "Reading files by file handle not implemented yet";
        }

        let components = path.split('/');
        let last_component = components.slice(-1)[0];
        let without_last_component = components.slice(0, -1).join('/');

        let variants = [
            `${without_last_component}/${last_component}`,
            `${without_last_component}/${capitalizeImpl(last_component)}`,
            `${without_last_component}/${last_component.toLowerCase()}`
        ];
        let error_stack = [];

        for (let eblan of variants) {
            let xhr = new XMLHttpRequest();
            xhr.overrideMimeType('application/octet-stream; charset=x-user-defined');
            xhr.open("GET", eblan, false);
            try {
                xhr.send();
            } catch (e) {
                if (e.message.startsWith("Failed to execute 'send'")) {
                    error_stack.push(`Server returned status code 404 (${path})`);
                } else {
                    error_stack.push(e);
                }

                continue;
            }
            if (xhr.status !== 200 && xhr.status !== 0) {
                error_stack.push(`Server returned status code ${xhr.status}`);
                continue;
            }
            let res = Uint8Array.from(xhr.response, c => c.charCodeAt(0));
            if (options.encoding === "utf8" || options.encoding === "utf-8")
                return (new TextDecoder()).decode(res);
            return new Buffer(res);
        }

        console.log(error_stack);
        throw error_stack[0];
    },

    writeFileSync: function (path, data) {
        console.log(path);
        let tmparr = require.libs.path._solve_dots(path).split("/");
        if (tmparr[tmparr.length - 2] === "save") {
            console.log("Using NativeFunctions.writeSaveFileUTF8");
            return NativeFunctions.writeSaveFileUTF8(path, data);
        }
        throw "Cannot write file outside of the save directory";
    },

    writeFile: function (path, data, callback) {
        let tmparr = require.libs.path._solve_dots(path).split("/");
        if (tmparr[tmparr.length - 2] === "save") {
            console.log("Using NativeFunctions.writeSaveFileUTF8");
            let res = NativeFunctions.writeSaveFileUTF8(path, data)
            callback(null);
            return res;
        }
        callback(new Error("Cannot write file outside of the save directory"));
    },

    readFile: function (path, callback) {
        if (path.startsWith(".") && !path.startsWith("./")) {
            path = "./" + path.substr(1);
        }
        let xhr = new XMLHttpRequest();
        xhr.responseType = "arraybuffer";
        xhr.open("GET", path, true);
        xhr.onload = (_event) => {
            if (xhr.status !== 200 && xhr.status !== 0) {
                callback(new Error(`Server returned status code ${xhr.status}`));

            } else if (xhr.response) {
                var buffer = new Buffer(xhr.response);
                callback(null, buffer);

            } else {
                callback(new Error("Empty response"));
            }
        };
        xhr.send(null);
    },

    readdirSync: function (path) {
        // This whole function is one big hack
        let xhr = new XMLHttpRequest();
        xhr.open("GET", require("path").join(path, "_DIRECTORY.json"), false);
        try {
            xhr.send();
        } catch (e) {
            if (e.message.startsWith("Failed to execute 'send'")) {
                throw new Error(`Server returned status code 404 for file ${path}, either path is invalid or doesn't contain a _DIRECTORY.json file`);
            } else {
                throw e;
            }
        }

        if (xhr.status === 404) {
            throw new Error(`Server returned status code 404 for file ${path}, either path is invalid or doesn't contain a _DIRECTORY.json file`);
        }
        if (xhr.status !== 200 && xhr.status !== 0) {
            throw new Error(`Server returned status code ${xhr.status}`);
        }

        return JSON.parse(xhr.responseText);
    },

    statSync: function (path) {
        // TODO: Implement everything besides just "isDirectory"
        let tmparr = require.libs.path._solve_dots(path).split("/");
        if (tmparr[tmparr.length - 2] === "save") {
            return { isDirectory: () => false };
        }
        if (tmparr[tmparr.length - 1] === "save") {
            return { isDirectory: () => true };
        }

        let xhr = new XMLHttpRequest();
        xhr.open("GET", require("path").join(path, "_DIRECTORY.json"), false);
        try {
            xhr.send();
        } catch (e) {
            if (e.message.startsWith("Failed to execute 'send'")) {
                return { isDirectory: () => false };
            }
            throw e;
        }
        if (xhr.status === 404) {
            return { isDirectory: () => false };
        }
        return { isDirectory: () => true };
    },

    existsSync: function (path) {
        let tmparr = require.libs.path._solve_dots(path).split("/");

        if (tmparr[tmparr.length - 2] === "save") {
            return NativeFunctions.saveFileExists(`${process.env.ROOT_PATH}/save/` + tmparr[tmparr.length - 1]);
        }
        if (tmparr[tmparr.length - 1] === "save") {
            return true;
        }

        let xhr = new XMLHttpRequest();
        xhr.open("GET", path, false);
        try {
            xhr.send();
        } catch (e) {
            if (e.message.startsWith("Failed to execute 'send'")) {
                return false;
            }
            throw e;
        }
        return xhr.status === 200 || xhr.responseText !== "";
    },

    unlinkSync: function () {
        // Literally just do nothing
    }
};

require.libs.os = {
    platform: () => window.platform
};

const nw_window = {
    get: () => {
        return window;
    },

    focus: () => { },
}
const nw_impl = {
    App: {
        argv: "--"
    },
    Window: nw_window,
    window: nw_window,

    Screen: {
        Init: function () { },
        on: function (name, callback) {
            //console.log("require('nw.gui').Screen.on", name, callback);
        }
    }
}
window.nw = nw_impl;
require.libs["nw.gui"] = nw_impl;

window.on = function (...rest) {
    console.log("on", rest);
}

window.onerror = function (message, source, lineno, colno, error) {
    if (error === undefined) {
        console.log(message);
        return;
    }

    console.log(error.stack)
}

// var origConsoleLog = console.log;
// console.log = function (...rest) {
//     origConsoleLog(`[LOG] ${String(rest)}`)
//     //origConsoleLog(...rest);
// }

var setSizesInterval;
// setSizesInterval = setInterval(function() {
//     console.log("Interval fired!");

//     document.getElementById("ErrorPrinter").style["font-size"] = "10px";

//     document.getElementById("GameCanvas").style["width"] = `${Math.floor(window.screen.height * 4 / 3)}px`;
//     document.getElementById("GameCanvas").style["height"] = `${window.screen.height}px`;
//     document.getElementById("GameCanvas").style["inset"] = "0px 0px 0px 0px";
//     document.getElementById("GameCanvas").style["margin"] = "0";
//     document.getElementById("GameCanvas").style["margin-left"] = "auto";
//     document.getElementById("GameCanvas").style["margin-right"] = "auto";

//     clearInterval(setSizesInterval);

//     for (let element of document.getElementsByClassName("controler-button")) {
//         element.style["display"] = "inline";
//     }
// }, 500);


// setTimeout(function() {
// console.log("Size is", window.innerWidth, window.innerHeight)
// }, 1000);

function button_down(event_data) {
    // console.log("In button_down");
    document.dispatchEvent(new KeyboardEvent("keydown", event_data));
}

function button_up(event_data) {
    // console.log("In button_up");
    document.dispatchEvent(new KeyboardEvent("keyup", event_data));
}