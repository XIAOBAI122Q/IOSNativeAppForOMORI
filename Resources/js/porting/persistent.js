// by VienDesu! Poring Team 2023

window.PERSISTENT_IMPLEMENTATIONS = {
    stub: stubImplementation,
    localStorage: localStorageImplementation,
}

function localStorageImplementation() {
    return {
        readSaveFileUTF8(path) {
            console.log(`Failed to get externalStorage. Using localStorage to read save at ${path}`);
            return localStorage.getItem(path);
        },

        saveFileExists(path) {
            console.log(`Using localStorage while checking save file ${path} existence`);
            return localStorage.getItem(path) != null;
        },

        writeSaveFileUTF8(path, data) {
            console.log(`Failed to get externalStorage. Writing ${path} save file to the localStorage`);
            localStorage.setItem(path, data);
        }
    };
}

function stubImplementation() {
    return {
        readSaveFileUTF8(path) {
            console.log(`Tried to read save from ${path}, but it is stub!`);
            return ``;
        },

        saveFileExists(path) {
            console.log(`Tried to check save file at ${path}, stub will always report false`);
            return false;
        },

        writeSaveFileUTF8(path, data) {
            console.log(`Tried to write save file at ${path}, but I'm just a stub, not a real back-end`);
        }
    };
}

if (typeof NativeFunctions == 'undefined') {
    window.NativeFunctions = PERSISTENT_IMPLEMENTATIONS.localStorage();
}
