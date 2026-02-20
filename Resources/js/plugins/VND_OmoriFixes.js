// by VienDesu! 2023

//=============================================================================
// * Patches for rpg_core
//=============================================================================

Bitmap.prototype._requestImage = function (url) {
    if (Bitmap._reuseImages.length !== 0) {
        this._image = Bitmap._reuseImages.pop();
    } else {
        this._image = new Image();
    }

    url = replaceSpecialSymbols(url);
    url = require("fs").cachedAlternativeName(url);

    if (this._decodeAfterRequest && !this._loader) {
        this._loader = ResourceHandler.createLoader(url, this._requestImage.bind(this, url), this._onError.bind(this));
    }

    this._image = new Image();
    this._url = url;
    this._loadingState = 'requesting';

    if (!Decrypter.checkImgIgnore(url) && Decrypter.hasEncryptedImages) {
        this._loadingState = 'decrypting';
        Decrypter.decryptImg(url, this);
    } else {
        this._image.src = encodeURI(url);

        this._image.addEventListener('load', this._loadListener = Bitmap.prototype._onLoad.bind(this));
        this._image.addEventListener('error', this._errorListener = this._loader || Bitmap.prototype._onError.bind(this));
    }
};

Graphics.printLoadingError = function (url) {
    if (this._errorPrinter && !this._errorShowed) {
        this._errorPrinter.innerHTML = this._makeErrorHtml('Loading Error', 'Failed to load: ' + url);
        var button = document.createElement('button');
        button.innerHTML = 'Retry';
        button.style.fontSize = '24px';
        button.style.color = '#000000';
        button.style.backgroundColor = '#000000';
        button.onmousedown = button.ontouchstart = function (event) {
            ResourceHandler.retry();
            event.stopPropagation();
        };
        this._errorPrinter.appendChild(button);
        this._loadingCount = -Infinity;
    }
};

Graphics._switchFullScreen = function () {
    this._requestFullScreen();
};

Graphics._isFullScreen = function () {
    return true;
};

Graphics._requestFullScreen = function () {
    try {
        var element = document.body;
        if (element.requestFullScreen) {
            element.requestFullScreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullScreen) {
            element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    } catch (e) {
        console.log(`Fullscreen request denied! %s`, e)
    }
};

Input._wrapNwjsAlert = function () {
    if (Utils.isNwjs()) {
        var _alert = window.alert;
        window.alert = function () {
            var gui = require('nw.gui');
            var win = gui.window;
            _alert.apply(this, arguments);
            win.focus();
            Input.clear();
        };
    }
};

Input._setupEventHandlers = function () {
    document.addEventListener('keydown', this._onKeyDown.bind(this));
    document.addEventListener('keyup', this._onKeyUp.bind(this));
};

//=============================================================================
// * Patches for rpg_managers
//=============================================================================

DataManager.loadDataFile = function (name, src) {
    var xhr = new XMLHttpRequest();
    var url = _dfs.cachedAlternativeName('data/' + src);
    xhr.open('GET', url);
    xhr.overrideMimeType('application/json');
    xhr.onload = function () {
        if (xhr.status < 400) {
            window[name] = JSON.parse(xhr.responseText);
            DataManager.onLoad(window[name]);
        }
    };
    xhr.onerror = this._mapLoader || function () {
        DataManager._errorUrl = DataManager._errorUrl || url;
    };
    window[name] = null;
    xhr.send();
};

ImageManager.loadBitmap = function (folder, filename, hue, smooth) {
    if (filename) {
        var path = folder + filename + '.png';
        var bitmap = this.loadNormalBitmap(path, hue || 0);
        bitmap.smooth = smooth;
        return bitmap;
    } else {
        return this.loadEmptyBitmap();
    }
};

ImageManager.loadNormalBitmap = function (path, hue) {
    var key = this._generateCacheKey(path, hue);
    var bitmap = this._imageCache.get(key);
    if (!bitmap) {
        bitmap = Bitmap.load(decodeURIComponent(replaceSpecialSymbols(path)));
        bitmap.addLoadListener(function () {
            bitmap.rotateHue(hue);
        });
        this._imageCache.add(key, bitmap);
    } else if (!bitmap.isReady()) {
        bitmap.decode();
    }

    return bitmap;
};

SceneManager.initNwjs = function () {
    if (Utils.isNwjs()) {
        var gui = require('nw.gui');
        var win = gui.window;
        if (process.platform === 'darwin' && !win.menu) {
            var menubar = new gui.Menu({ type: 'menubar' });
            var option = { hideEdit: true, hideWindow: true };
            menubar.createMacBuiltin('Game', option);
            win.menu = menubar;
        }
    }
};

SceneManager.onKeyDown = function (event) {
    if (!event.ctrlKey && !event.altKey) {
        switch (event.keyCode) {
            case 116:   // F5
                if (Utils.isNwjs()) {
                    location.reload();
                }
                break;
            case 119:   // F8
                if (Utils.isNwjs() && Utils.isOptionValid('test')) {
                    require('nw.gui').window.showDevTools();
                }
                break;
        }
    }
};

//=============================================================================
// * Patches for rpg_objects
//=============================================================================

Game_Temp.prototype.setDestination = function (x, y) {
    return;
};
