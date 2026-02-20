/*:
 * @plugindesc A (not so) accurate implementation of the new OMORI border system.
 * @author NTHung (Harlow Nylvesky)
 *
 * @help
 * This plugin will somehow replicate the new border system in the console / Game Pass version based on full.bin.
 * Please know that there might be some... inaccuracy, but that's normal when re-implementing something, right?
 * 
 * All credits goes to the Vietnamese AowVN translation group, more specifically, NTHung, otherwise known as Harlow Nylvesky (it's my nickname ;)).
 * 
 * @param Animation Interval
 * @type number
 * @desc (Advanced) Change if the animation is jittery (in miliseconds), prefer numbers divisible by 1000.
 * @default 5
 * 
 * @param Animation Length
 * @type number
 * @decimals 2
 * @desc (Advanced) The duration of border switching animation, calculated in seconds.
 * @default 0.50
 */

var _forcedBorder = null;
var _mapBorder = "";
var border
var borderAnimation = null;

const farawayFullCycleMaps = [
    [14, 15, 16, 17, 23, 24, 25, 26, 32, 33, 34, 35, 40, 41, 42, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 75, 46, 47, 48, 49, 377, 371, 382, 383, 384, 386], // day
    [18, 19, 20, 21, 27, 28, 29, 30, 36, 37, 38, 39, 43, 44, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 76, 50, 51, 52, 53, 370, 376, 378], // sunset
    [77, 78, 79, 80, 81, 82, 83, 84, 85, 320, 372, 413, 503, 498] // night
];
const BLACKSPACE_MAPS = [
    263, 264, 265, 277, 278, 266, 283, 398, 280, 281, 282, 286, 272, 273, 271, 394,
    267, 287, 288, 292, 295, 392, 284, 285, 395, 396, 397, 412, 275, 276, 298, 502,
    289, 290, 291, 501, 414, 146, 268, 293, 294, 296, 420, 445, 448, 451, 454, 455,
    456, 457, 458, 301, 460, 303, 462, 463, 496, 304, 464, 507, 508, 509, 510, 511,
    512, 459, 299, 269, 300, 302, 305, 310, 311, 312, 313, 314, 315, 316
];
'use strict';

const borderParameters = PluginManager.parameters('HN_Border');
const borderInterval = Math.round(borderParameters['Animation Interval'] || 5);
const borderDuration = Number(borderParameters['Animation Length'] || 0.5);

ConfigManager._handheld = false;

ConfigManager._screenBorder = "border_default";
var borders = ["border_default", "border_omori", "border_aubrey", "border_kel", "border_hero", "border_mari", "border_basil"];

ConfigManager.forcedScreenBorder = null;
ConfigManager.mapScreenBorder = "";

Object.defineProperty(ConfigManager, 'screenBorder', {
    get: function() {
        return this._screenBorder;
    },
    set: function(value) {
        this._screenBorder = value;
        _refresh_screen_border(value == "border_solidblack");
    },
    configurable: true
});



Object.defineProperty(ConfigManager, 'borderName', {
    get: function() {
        return LanguageManager.getPluginText('optionsMenu', 'system').screenBorder.entries[this.screenBorder];
    },
    configurable: true
});

ConfigManager = class extends ConfigManager {
    static restoreDefaultConfig() {
        this.screenBorder = $gameSwitches.value(1407) ? "border_default" : "border_defaultnomemory";
        this.handheld = false;
        super.restoreDefaultConfig();
    }
    static makeData() {
        var config = super.makeData();
        config.forcedScreenBorder = _forcedBorder;
        config.mapScreenBorder = _mapBorder;
        config.screenBorder = this.screenBorder;
        config.handheld = this.handheld;

        return config;
    }
    static applyData(config) {
        super.applyData(config);
        if (config.screenBorder !== undefined)
        {
            _forcedBorder = config.forcedScreenBorder;
            _mapBorder = config.mapScreenBorder;
            this._screenBorder = config.screenBorder;
        }

        if (config.handheld !== undefined)
        {
            this.handheld = config.handheld;
        }
            
    }
}
DataManager = class extends DataManager {
    static _restoreGlobalInfo() {
        super._restoreGlobalInfo();
        _refresh_screen_border();
    }

    static extractSaveContents(contents) {
        super.extractSaveContents(contents);
        $gameSwitches.onChange();
    }
}
Window_OmoMenuOptionsSystem = class extends Window_OmoMenuOptionsSystem {
    initialize() {
        super.initialize();
        this.setHandler('screenBorder', this.changeBorder.bind(this));
        this.setHandler('handheld', this.handheldMode.bind(this));
    }
    maxCols() { return 2; }
    cursorRight() {} // Disable pressing right
    cursorLeft() {} // Disable pressing left
    changeBorder() {
        if (borders.slice(-1)[0] != ConfigManager.screenBorder) {
            ConfigManager.screenBorder = _get_next_border();
        } else {
            ConfigManager.screenBorder = "border_solidblack";
        }
        this._list[7].name = ConfigManager.borderName; // 7 = index of the border name
        this.redrawItem(7);
        this.activate();
        
        // 立即刷新边框
        _refresh_screen_border();
    }
    

    handheldMode()
    {
        ConfigManager.handheld = !ConfigManager.handheld;
        this._list[9].name = LanguageManager.getPluginText('optionsMenu', 'system').handheld.options[Number(ConfigManager.handheld)] // 9 = index of the handheld mode (check below)
        this.redrawItem(9);
        this.activate();
    }

    makeCommandList() {
        const isOptionsScene = SceneManager._scene.constructor === Scene_OmoMenuOptions;
        const isSceneTitle = SceneManager._scene instanceof Scene_OmoriTitleScreen;
    
        var text = LanguageManager.getPluginText('optionsMenu', 'system');
    
        this.addCommand(text.restoreConfig.text, 'restoreConfig', isSceneTitle);
        this.addCommand(); // stub command
        this.addCommand(text.load.text, 'load', isOptionsScene);
        this.addCommand(); // stub command
        this.addCommand(text.toTitleScreen.text, 'toTitleScreen', isOptionsScene);
        this.addCommand(); // stub command
        this.addCommand(text.screenBorder.text, 'screenBorder');
        this.addCommand(ConfigManager.borderName);
        // 注释或删除以下与手柄相关的命令
        // this.addCommand(text.handheld.text, 'handheld');
        // this.addCommand(text.handheld.options[Number(ConfigManager.handheld)]);
        this.addCommand(text.exit.text, 'exit');
    }
    
    getCommandHelpText(symbol = this.currentSymbol()) {
        // Symbol Switch Case

        var text = LanguageManager.getPluginText('optionsMenu', 'system');

        switch (symbol) {
            case 'restoreConfig':
                return text.restoreConfig.help;
            case 'load':
                return text.load.help;
            case 'toTitleScreen':
                return text.toTitleScreen.help;
            case 'screenBorder':
                return text.screenBorder.help;
            case 'handheld':
                return text.handheld.help;
            case 'exit':
                return text.exit.help;
            default:
                // Return error as default
                return "* ERROR!!! *";
        }
    };
}

Graphics = class extends Graphics {
    static _createCanvas() {
        super._createCanvas();
        this._overlayFix.style.backgroundPosition = 'center';
        this._overlayFix.style.backgroundRepeat = "no-repeat";
        this._overlayFix.style.backgroundSize  = 'cover'; // 修改为 'cover' 以适应不同设备
        this._overlayFix.style.backgroundAttachment = 'fixed';
        this._overlayFix.style.backgroundImage = `url()`;
        this._overlayFix.style.width = '100%'; // 确保宽度为100%
        this._overlayFix.style.height = '100%'; // 确保高度为100%
        this._overlayFix.style.position = 'absolute'; // 确保覆盖整个屏幕
        this._overlayFix.style.top = '0';
        this._overlayFix.style.left = '0';
    }
    static _requestFullScreen() {
        super._requestFullScreen();
        this._setHandheld();
        this._resizeForFullScreen(); // 调整全屏模式下的尺寸
    }
    static _setHandheld()
    {
        if (ConfigManager.handheld)
        {
            window.innerWidth = window.screen.width;
        }
        else
        {
            window.innerWidth = window.screen.width;
        }
        if (this._overlayFix.style.backgroundImage != `url()`)
        {
            this._overlayFix.style.backgroundImage = `url(img/system/${border}${(ConfigManager.handheld ? "_handheld" : "")}.png)`;
            this._overlayFix.style.backgroundSize = 'cover'; // 确保边框覆盖整个屏幕
        }
        //window.dispatchEvent(new Event('resize'));
    }
    static _resizeForFullScreen() {
        if (document.fullscreenElement) {
            this._overlayFix.style.width = '100vw';
            this._overlayFix.style.height = '100vh';
        } else {
            this._overlayFix.style.width = '100%';
            this._overlayFix.style.height = '100%';
        }
    }
    // remove Yanfly.Param.UpdateRealScale override
    static _updateRealScale() {
        if (this._stretchEnabled) {
            var h = window.innerWidth / this._width;
            var v = window.innerHeight / this._height;
            if (h >= 1 && h - 0.01 <= 1) h = 1;
            if (v >= 1 && v - 0.01 <= 1) v = 1;
            this._realScale = Math.min(h, v);
        }
        else {
            this._realScale = this._scale;
        }
        this._resizeForFullScreen(); // 调整全屏模式下的尺寸
    };

    

    static isBorderSwitchable() { return ConfigManager.screenBorder != 'border_solidblack'; }
    static forceMapBorder(name) {
        _mapBorder = name;
    }

    static unlockMapScreenBorder() {
        _mapBorder = null;
    }
}

Scene_OmoriTitleScreen = class extends Scene_OmoriTitleScreen {
    initialize() {
        super.initialize();
        switch (this._worldType)
        {
            case 0:
            case 446:
                Graphics.forceMapBorder("border_whitespace");
                break;
            case 444:
                Graphics.forceMapBorder("border_solidblack");
                break;
            case 445:
                Graphics.forceMapBorder("border_redspace");
                break;
            case 447:
            case 448:
            case 449:
                Graphics.forceMapBorder("border_farawayday");
                break;
        }
        _refresh_screen_border();
    }
}
Game_System = class extends Game_System {
    isFarawayDay() { return $gameSwitches.value(7) && !$gameSwitches.value(159) && !$gameSwitches.value(464); }
    isFarawayAfternoon() { return $gameSwitches.value(7) && $gameSwitches.value(159); }
    isFarawayNight() { return $gameSwitches.value(7) && $gameSwitches.value(464); }

    isFarawayRainy(id) { return id == 385; }
    isFarawayRainyNight(id) { return [387, 379].includes(id); }

    isBlackspace(id) { return BLACKSPACE_MAPS.includes(id); }
    isWhiteSpace(id) { return [87, 388, 389, 390, 467].includes(id); }
    isRedspace(id) { return [274, 317, 318, 465, 500].includes(id); }

    isSolidBlackBorder(id) { return [279, 297, 374, 148, 259, 309, 380, 356, 381, 470, 999].includes(id); }

    forceScreenBorder(name) {
        _forcedBorder = name;
        _refresh_screen_border();
    }
    unlockScreenBorder() { 
        _forcedBorder = null;
        _refresh_screen_border();
    }
}
Game_Switches = class extends Game_Switches {
    onChange() {
        super.onChange();
        const IS_BASIL_FORGOTTEN = $gameSwitches.value(1407);
        const HAS_RED_HAND = $gameSwitches.value(1623);
        if (IS_BASIL_FORGOTTEN)
        {
            borders = ["border_defaultnomemory", "border_omori", "border_aubrey", "border_kel", "border_hero", "border_mari"];
            
            if (ConfigManager.screenBorder == "border_basil")
            {
                ConfigManager.screenBorder = borders[0];
            }
        }
        else
        {
            borders = ["border_default", "border_omori", "border_aubrey", "border_kel", "border_hero", "border_mari", "border_basil"];
        }
        borders[1] = HAS_RED_HAND ? "border_omori_redhand" : "border_omori";
        

        if (ConfigManager.screenBorder.includes("border_omori"))
        {
            ConfigManager.screenBorder = borders[1];
        }
        else if (ConfigManager.screenBorder.includes("border_default"))
        {
            ConfigManager.screenBorder = borders[0];
        }
    }
}
Game_Player = class extends Game_Player {
    performTransfer() {
        if (this.isTransferring()) {
            Graphics.unlockMapScreenBorder();

            if ($gameSystem.isSolidBlackBorder(this._newMapId))
            {
                Graphics.forceMapBorder("border_solidblack");
                super.performTransfer();
                _refresh_screen_border();
                return;
            }
            else if ($gameSystem.isRedspace(this._newMapId))
            {
                Graphics.forceMapBorder('border_redspace');
                super.performTransfer();
                _refresh_screen_border();
                return;
            }
            else if ($gameSystem.isWhiteSpace(this._newMapId))
            {
                Graphics.forceMapBorder('border_whitespace');
                super.performTransfer();
                _refresh_screen_border();
                return;
            }
            else if ($gameSystem.isBlackspace(this._newMapId))
            {
                Graphics.forceMapBorder('border_blackspace');
                super.performTransfer();
                _refresh_screen_border();
                return;
            } 
            
            if ($gameSystem.isFarawayDay())
                Graphics.forceMapBorder('border_farawayday');
            else if ($gameSystem.isFarawayAfternoon())
                Graphics.forceMapBorder('border_farawayafternoon');
            else if ($gameSystem.isFarawayNight())
                Graphics.forceMapBorder('border_farawaynight');
            
            if (farawayFullCycleMaps[0].includes(this._newMapId))
            {
                Graphics.forceMapBorder('border_farawayday');
            }
            else if (farawayFullCycleMaps[1].includes(this._newMapId))
            {
                Graphics.forceMapBorder('border_farawayafternoon');
            }
            else if (farawayFullCycleMaps[2].includes(this._newMapId))
            {
                Graphics.forceMapBorder('border_farawaynight');
            }

            if ($gameSystem.isFarawayRainy(this._newMapId))
                Graphics.forceMapBorder('border_farawayday_rain');

            if ($gameSystem.isFarawayRainyNight(this._newMapId))
                Graphics.forceMapBorder('border_farawaynight_rain');
            
            super.performTransfer();
            _refresh_screen_border();
        }
    }
}

function _get_next_border() {
    var index = (borders.indexOf(ConfigManager.screenBorder) + 1) % borders.length;
    return borders[index];
}

function _refresh_screen_border(forcedBlackBorder = false) {
    if (!forcedBlackBorder)
    {
        if (!Graphics.isBorderSwitchable() || border == (_forcedBorder || _mapBorder || ConfigManager.screenBorder))
            return;
    
            border = _forcedBorder || _mapBorder || ConfigManager.screenBorder;
    }
    else
    {
        border = "border_solidblack";
    }
    

    clearInterval(borderAnimation);
    borderAnimation = null;
    var pos = 0;

    const fadeDelta = Graphics._overlayFix.style.opacity * 1.0 / (borderDuration * 500.0 / borderInterval); // If the animation got interrupted suddenly

    borderAnimation = setInterval(function() {
        if (pos == borderDuration * 1000.0 / borderInterval) { // 1s
            Graphics._overlayFix.style.opacity = 1;
            clearInterval(borderAnimation);
            borderAnimation = null;
        }
        else {
            pos++;
            if (pos < borderDuration * 500.0 / borderInterval)
                Graphics._overlayFix.style.opacity -= fadeDelta;
            else if (pos == borderDuration * 500.0 / borderInterval) {
                Graphics._overlayFix.style.opacity = 0;
                Graphics._overlayFix.style.backgroundImage = `url(img/system/${border}${(ConfigManager.handheld ? "_handheld" : "")}.png)`;
                Graphics._overlayFix.style.backgroundSize = 'cover'; // 确保边框覆盖整个屏幕
                Graphics._overlayFix.style.width = '100%'; // 确保宽度为100%
                Graphics._overlayFix.style.height = '100%'; // 确保高度为100%
                Graphics._overlayFix.style.position = 'absolute'; // 确保覆盖整个屏幕
                Graphics._overlayFix.style.top = '0';
                Graphics._overlayFix.style.left = '0';
            }
            else { // pos > borderDuration * 500.0 / borderInterval
                // OK how many bags of weed did you use, huh, JS devs?
                Graphics._overlayFix.style.opacity = parseFloat(Graphics._overlayFix.style.opacity) + 0.002 * borderInterval / borderDuration;
            }
        }
    }, borderInterval);
}

Window_OmoMenuOptionsGeneral.prototype.cursorRight = function(wrap) {
    if (this.index() === 0 && this._optionsList[this.index()].index === 0 && window.screen.availHeight < 2 * 640)
        return;
    // Super Call
    Window_Selectable.prototype.cursorRight.call(this, wrap);
    // Get Data
    var data = this._optionsList[this.index()];
    // Get Data
    if(this.index() === 0 && !Graphics._isFullScreen()) {
    SoundManager.playBuzzer();
    return;
    } 
    if (data) {
    // Set Data Index
    data.index = (data.index + 1) % data.options.length;
    // Process Option Command
    this.processOptionCommand();
    // Update Cursor
    this.updateCursor();
    }
};

Window_OmoMenuOptionsGeneral.prototype.cursorLeft = function(wrap) {
    if (this.index() === 0 && this._optionsList[this.index()].index === 0 && window.screen.availHeight < 2 * 640)
        return;
    // Super Call
    Window_Selectable.prototype.cursorLeft.call(this, wrap);
    // Get Data
    var data = this._optionsList[this.index()];
    // Get Data
    if(this.index() === 0 && !Graphics._isFullScreen()) {
    SoundManager.playBuzzer();
    return;
    } 
    if (data) {
    // Get Max Items
    var maxItems = data.options.length;
    // Set Data Index
    data.index = (data.index - 1 + maxItems) % maxItems;
    // Process Option Command
    this.processOptionCommand();
    // Update Cursor
    this.updateCursor();
    };
};

old_Scene_Base_fadeOutAll = Scene_Base.prototype.fadeOutAll;
Scene_Base.prototype.fadeOutAll = function() {
    old_Scene_Base_fadeOutAll.call(this);
    Graphics.forceMapBorder("border_solidblack");
    _refresh_screen_border();
}

Yanfly.updateResolution = function() {
    var resizeWidth = Yanfly.Param.ScreenWidth - window.innerWidth;
    var resizeHeight = Yanfly.Param.ScreenHeight - window.innerHeight;
    if (!Imported.ScreenResolution) {
        window.moveBy(-1 * resizeWidth / 2, -1 * resizeHeight / 2);
        window.resizeBy(resizeWidth * devicePixelRatio, resizeHeight * devicePixelRatio);
    }
};
SceneManager = class extends SceneManager
{
    static goto(sceneClass)
    {
        super.goto(sceneClass)
        if (sceneClass !== null && sceneClass.constructor === Scene_OmoriTitleScreen)
        {
            
            Graphics.unlockScreenBorder();
        }
    }
}


