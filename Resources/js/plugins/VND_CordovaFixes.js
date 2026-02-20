// by VienDesu! Poring Team 2023

// =========================================================
//   Add Cordova pause/resume events support for RPG Maker
// =========================================================

WebAudio.prototype._setupEventHandlers = function () {
    var resumeHandler = function () {
        var context = WebAudio._context;
        if (context && context.state === "suspended" && typeof context.resume === "function") {
            context.resume().then(function () {
                WebAudio._onTouchStart();
            });
        } else {
            WebAudio._onTouchStart();
        }
    };
    document.addEventListener("keydown", resumeHandler);
    document.addEventListener("mousedown", resumeHandler);
    document.addEventListener("touchend", resumeHandler);
    document.addEventListener('touchstart', this._onTouchStart.bind(this));
    document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
    document.addEventListener("deviceready", this._onCordovaDeviceReady.bind(this), false);
};

WebAudio.prototype._onCordovaDeviceReady = function () {
    console.log("WebAudio - SETUP!!!"); //Remove in release
    document.addEventListener("pause", this._onCordovaPause.bind(this), false);
    document.addEventListener("resume", this._onCordovaResume.bind(this), false);
};

WebAudio.prototype._onCordovaPause = function () {
    console.log("WebAudio - HIDE!!!"); //Remove in release
    this._onHide();
};

WebAudio.prototype._onCordovaResume = function () {
    console.log("WebAudio - SHOW!!!"); //Remove in release
    this._onShow();
};

Html5Audio.prototype._setupEventHandlers = function () {
    document.addEventListener('touchstart', this._onTouchStart.bind(this));
    document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
    this._audioElement.addEventListener("loadeddata", this._onLoadedData.bind(this));
    this._audioElement.addEventListener("error", this._onError.bind(this));
    this._audioElement.addEventListener("ended", this._onEnded.bind(this));
    this._audioElement.addEventListener("deviceready", this._onCordovaDeviceReady.bind(this), false);
};

Html5Audio.prototype._onCordovaDeviceReady = function () {
    console.log("Html5Audio - SETUP!!!"); //Remove in release
    this._audioElement.addEventListener("pause", this._onCordovaPause.bind(this), false);
    this._audioElement.addEventListener("resume", this._onCordovaResume.bind(this), false);
};

Html5Audio.prototype._onCordovaPause = function () {
    console.log("Html5Audio - HIDE!!!"); //Remove in release
    this._onHide();
};

Html5Audio.prototype._onCordovaResume = function () {
    console.log("Html5Audio - SHOW!!!"); //Remove in release
    this._onShow();
};

// =====================================================================
//   Add Cordova pause/resume events support for AudioStreaming plugin
// =====================================================================

StreamWebAudio.prototype._setupEventHandlers = function() {
    var resumeHandler = function() {
        var context = StreamWebAudio._context;
        if (context && context.state === "suspended" && typeof context.resume === "function") {
            context.resume().then(function() {
                StreamWebAudio._onTouchStart();
            })
        } else {
            StreamWebAudio._onTouchStart();
        }
    };
    document.addEventListener("keydown", resumeHandler);
    document.addEventListener("mousedown", resumeHandler);
    document.addEventListener("touchend", resumeHandler);
    document.addEventListener('touchstart', this._onTouchStart.bind(this));
    document.addEventListener('visibilitychange', this._onVisibilityChange.bind(this));
    document.addEventListener("deviceready", this._onCordovaDeviceReady.bind(this), false);
};

StreamWebAudio.prototype._onCordovaDeviceReady = function () {
    console.log("StreamWebAudio - SETUP!!!"); //Remove in release
    document.addEventListener("pause", this._onCordovaPause.bind(this), false);
    document.addEventListener("resume", this._onCordovaResume.bind(this), false);
};

StreamWebAudio.prototype._onCordovaPause = function () {
    console.log("StreamWebAudio - HIDE!!!"); //Remove in release
    this._onHide();
};

StreamWebAudio.prototype._onCordovaResume = function () {
    console.log("StreamWebAudio - SHOW!!!"); //Remove in release
    this._onShow();
};

// ============================
//   Clear back button action
// ============================

document.addEventListener("backbutton", function(event){
    event.preventDefault();
});

// =====================
//   Scale game canvas
// =====================

Graphics._updateRealScale = function () {
    if (this._stretchEnabled) {
        var h = window.innerWidth / this._width;
        var v = window.innerHeight / this._height;
        if (h >= 1 && h - 0.01 <= 1) h = 1;
        if (v >= 1 && v - 0.01 <= 1) v = 1;
        this._realScale = Math.min(h, v);
    } else {
        this._realScale = this._scale;
    }
};

// ===========================
//   Gamepad tips on default
// ===========================

ConfigManager.gamepadTips = true;

ConfigManager.applyData = function (config) {
    _TDS_.OmoriBASE.ConfigManager_applyData.call(this, config);
    var initCheckList = ['characterStrafe', 'battleAnimations',
      'battleAnimationSpeed', 'battleLogSpeed', 'screenResolution',
      'fullScreen', 'menuAnimations']
    for (var i = 0; i < initCheckList.length; i++) {
      var name = initCheckList[i];
      if (config[name] === undefined) { config[name] = this[name]; };
    };
    Yanfly.Param.ScreenWidth = 640 * (config.screenResolution + 1);
    Yanfly.Param.ScreenHeight = 480 * (config.screenResolution + 1);
    SceneManager._screenWidth = Yanfly.Param.ScreenWidth;
    SceneManager._screenHeight = Yanfly.Param.ScreenHeight;
    this.characterTurning = config.characterTurning;
    this.characterStrafe = config.characterStrafe;
    this.battleAnimations = config.battleAnimations;
    this.battleAnimationSpeed = config.battleAnimationSpeed;
    this.battleLogSpeed = config.battleLogSpeed === undefined ? 1 : config.battleLogSpeed;
    this.screenResolution = config.screenResolution;
    this.fullScreen = config.fullScreen;
    this.menuAnimations = config.menuAnimations;
    this.gamepadTips = config.gamepadTips || true;
    this.textSkip = config.textSkip || false;
    Input.keyMapper = config.keyboardInputMap;
    Input.gamepadMapper = config.gamepadInputMap;
    if (Input.keyMapper === undefined) { this.setDefaultKeyboardKeyMap(); };
    if (Input.gamepadMapper === undefined) { this.setDefaultGamepadKeyMap(); };
    Yanfly.updateResolution();
    Yanfly.moveToCenter();
  
    if ($gameSwitches) {
      if (_TDS_.CharacterPressTurn_Strafing) {
        $gameSwitches.setValue(_TDS_.CharacterPressTurn_Strafing.params.strafingDisableSwitchID, this.characterStrafe);
        $gameSwitches.setValue(_TDS_.CharacterPressTurn_Strafing.params.pressDisableSwitchID, this.characterTurning)
      };
    };
};

ConfigManager.restoreDefaultConfig = function () {
    const fs = require("fs");
    const path = require('path');
    var base = path.dirname(process.mainModule.filename);
    base = path.join(base, 'save/');
    if (fs.existsSync(base + "config.rpgsave")) { fs.unlinkSync(base + "config.rpgsave"); }
    ConfigManager.characterStrafe = true;
    ConfigManager.characterTurning = true;
    ConfigManager.battleAnimations = true;
    ConfigManager.battleAnimationSpeed = 0;
    ConfigManager.battleLogSpeed = 1;
    ConfigManager.screenResolution = 0;
    ConfigManager.fullScreen = false;
    ConfigManager.menuAnimations = true;
    ConfigManager.gamepadTips = true;
    ConfigManager.alwaysDash = false;
    ConfigManager.textSkip = false;
    this.setDefaultKeyboardKeyMap();
    this.setDefaultGamepadKeyMap();
    AudioManager._bgmVolume = 70;
    AudioManager._bgsVolume = 90;
    AudioManager._meVolume = 90;
    AudioManager._seVolume = 90;
    ConfigManager.bgmVolume = 70
    ConfigManager.bgsVolume = 90
    ConfigManager.meVolume = 90
    ConfigManager.seVolume = 90
    ConfigManager.applyData(ConfigManager);
    let needsRestore = confirm(LanguageManager.languageData().text.System.plugins.optionsMenu.alertMessages["restoreGeneral"]);
    if (!!needsRestore) { DataManager._restoreGlobalInfo(); }
}

Window_OmoMenuOptionsGeneral.prototype.processOptionCommand = function() {
    var index = this.index();
    var data = this._optionsList[index];
    switch (index) {
      case 0: 
        ConfigManager.gamepadTips = data.index === 0 ? false : true;
        if(SceneManager._scene instanceof Scene_OmoriTitleScreen) {
          SceneManager._scene.refreshCommandHints(); // Refresh command title hints;
        }
        break;
      case 1: ConfigManager.textSkip = data.index === 0 ? true : false; break;
      case 2: ConfigManager.battleLogSpeed = data.index; ;break;
      case 3: ConfigManager.alwaysDash = data.index === 0 ? true : false ;break;
    };
  };

// ===================
// Android Wake Lock
// ===================

document.addEventListener("deviceready", () => {
    window.plugins.insomnia.keepAwake();
})

// =============================
//   Saves in external storage
// =============================

window._SAYGEXES = {};

function setSayGexValue(key, f, fallback) {
    let saygex = window._SAYGEXES[key];
    if (saygex != undefined) {
        return f(saygex);
    } else {
        window._SAYGEXES[key] = fallback;
    }
}

function getSaveName(path) {
    return require.libs.path._solve_dots(path).split("/")[1];
}

function getAndroidSavePath(path) {
    return cordova.file.externalDataDirectory + "save/" + getSaveName(path);
}

document.addEventListener("deviceready", () => {
    StorageManager.isLocalMode = function () {
        return true;
    };

    NativeFunctions.saveFileExists = function(path) {
        if (window._SAYGEXES[path] != undefined) {
            return window._SAYGEXES[path].exists;
        }

        let xhr = new XMLHttpRequest();
        xhr.open("GET", getAndroidSavePath(path), false);
        try {
            xhr.send();
        } catch (e) {
            setSayGexValue(path, (v) => { v.exists = false; }, {exists: false, content: null});
            return false;
        }

        var status = xhr.status === 200 || xhr.responseText !== "";
        setSayGexValue(path, (v) => { v.exists = status; }, {exists: status, content: null});
        return status;
    }

    NativeFunctions.readSaveFileUTF8 = function(path) {
        let gex = window._SAYGEXES[path];
        if (gex != undefined) {
            if (gex.content != null) {
                return gex.content;
            }
        }

        let xhr = new XMLHttpRequest();

        xhr.open("GET", getAndroidSavePath(path), false);
        xhr.setRequestHeader("Cache-Control", "no-cache, no-store, max-age=0");
        xhr.setRequestHeader("Expires", "Tue, 01 Jan 1980 1:00:00 GMT");
        xhr.setRequestHeader("Pragma", "no-cache");
        try {
            xhr.send();
        } catch (e) {
            if (e.message.startsWith("Failed to execute 'send'")) {
                alert(`Server returned status code 404 (${getAndroidSavePath(path)})`);
            } else {
                alert(e);
            }
        }
        if (xhr.status !== 200 && xhr.status !== 0) {
            alert(`Server returned status code ${xhr.status}`);
        }

        let text = xhr.responseText;
        setSayGexValue(path, (v) => { v.content = text; }, {exists: true, content: text});
        return text;
    }

    NativeFunctions.writeSaveFileUTF8 = function(path, data) {
        setSayGexValue(path, (v) => { v.exists = true; v.content = data; }, {exists: true, content: data});

        var split_path = require.libs.path._solve_dots(path).split("/");
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function (dirEntry) {
            console.log(`Writing ${path} save file to the externalStorage`);
            dirEntry.getDirectory(split_path[0], { create: true }, function (subDirEntry) {
                subDirEntry.getFile(split_path[1], {create: true, exclusive: false}, function(fileEntry) {

                    fileEntry.createWriter(function (fileWriter) {
            
                    fileWriter.onerror = function (e) {
                        console.error(`Failed file write: Error ${e.code}`);
                    };
            
                    fileWriter.write(data);
                });
                }, (e) => {
                    console.error(`Error to create external save file: Error ${e.code}`);
                });
            });
        });
    }
    
    NativeFunctions.writeExternalFileUTF8 = function(path, data) {
        var split_path = path.split("/");
        var directory = cordova.file.externalRootDirectory + "/Download";
        window.resolveLocalFileSystemURL(directory, function (dirEntry) {
            console.log(`Writing ${path} file to root storage.`);
            dirEntry.getFile(split_path[1], {create: true, exclusive: false}, function(fileEntry) {

                fileEntry.createWriter(function (fileWriter) {
        
                    fileWriter.onerror = function (e) {
                        console.error(`Failed file write: Error ${e.target.error.code}`);
                    };
            
                    fileWriter.write(data);
                });
            }, (e) => {
                console.error(`Error to create external file: Error ${e.code}`);
            });
        });
    }
})

// =============================
//   Close Android app from JS
// =============================

SceneManager.terminate = function () {
    navigator.app.exitApp();
};

window.close = function() {
    navigator.app.exitApp();
}

// ==========================================
//   Request storage permissions on startup
// ==========================================
document.addEventListener("deviceready", () => {
    var permissions = cordova.plugins.permissions;
    permissions.checkPermission(permissions.WRITE_EXTERNAL_STORAGE, (status) => {
        if (status.hasPermission === false) {
            permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE);
        }
    });
})