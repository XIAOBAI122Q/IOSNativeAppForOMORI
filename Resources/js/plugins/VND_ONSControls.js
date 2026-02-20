// by VienDesu! Poring Team 2024


//=============================================================================
// ** ONSControls
//=============================================================================
class ONSControls {};
//=============================================================================
// * Plugin options
//=============================================================================
ONSControls.options = PluginManager.parameters('VND_ONSControls');
//=============================================================================
// * Controls canvas
//=============================================================================
ONSControls.createCanvas = function() {
    const canvas = new PIXI.Application({
        width: innerWidth,
        height: innerHeight,
        autoResize: true,
        resolution: devicePixelRatio,
        transparent: true
    });
    document.body.appendChild(canvas.view);
    canvas.view.id = "ControlsCanvas";
    canvas.view.style.zIndex = this.options.zIndex;
    canvas.stage.interactive = true;
    canvas.vh = (persent) => {
        return canvas.screen.height * persent;
    }
    this._controlsCanvas = canvas;
}
//=============================================================================
// * A/B/X/Y Buttons
//=============================================================================
ONSControls.createButtons = function() {
    const container = new PIXI.Container();
    const buttons = [
        new PIXI.Sprite.fromImage("img/system/controls/omori_a_button.png"), 
        new PIXI.Sprite.fromImage("img/system/controls/omori_x_button.png"), 
        new PIXI.Sprite.fromImage("img/system/controls/omori_b_button.png"),
        new PIXI.Sprite.fromImage("img/system/controls/omori_y_button.png")
    ]
    for (btn of buttons) {
        btn.anchor.set(0.5);
        btn.hitArea = new PIXI.Circle(0, 0, 40);
        container.addChild(btn);
    }
    this._controlsCanvas.stage.addChild(container);
    this._buttonsContainer = container;
}
//=============================================================================
// * DPad Buttons
//=============================================================================
ONSControls.createDPad = function() {
    const container = new PIXI.Sprite.fromImage("img/system/controls/omori_dpad.png");
    container.anchor.set(0.5);
    container.interactive = true;
    container.pressed = false;
    container.pressed_button = null;
    container.hitArea = new PIXI.Polygon([-30,-83, 30,-83, 30,-30, 83,-30, 83,30, 30,30, 30,82, -30,82, -30,30, -83, 30, -83,-30, -30,-30]);
    container.down = function(x, y) {
        if (Math.abs(x) > container.width / 2 || Math.abs(y) > container.height / 2) {
            return; // Pointer out of dpad, ignoring event
        }
        var threshold = container.width / 5;
        var button;
        if (y < -threshold) {
            button = "DPAD_UP";
            ONSControls.dpadAnimation("up");
        } else if (y > threshold) {
            button = "DPAD_DOWN";
            ONSControls.dpadAnimation("down");
        }
        if (x < -threshold) {
            button = "DPAD_LEFT";
            ONSControls.dpadAnimation("left");
        } else if (x > threshold) {
            button = "DPAD_RIGHT";
            ONSControls.dpadAnimation("right");
        }
        if (button !== container.pressed_button && button !== undefined) {
            if (container.pressed_button !== null) {
                ONSControls.sendEvent({type: "pointerup"}, container.pressed_button);
                ONSControls.dpadAnimation(null);
            }
            container.pressed = true;
            container.pressed_button = button;
            ONSControls.sendEvent({type: "pointerdown"}, button);
        }
    }
    container.upAll = function() {
        container.pressed = false;
        container.pressed_button = null;
        ONSControls.sendEvent({type: "pointerup"}, "DPAD_RIGHT");
        ONSControls.sendEvent({type: "pointerup"}, "DPAD_DOWN");
        ONSControls.sendEvent({type: "pointerup"}, "DPAD_UP");
        ONSControls.sendEvent({type: "pointerup"}, "DPAD_LEFT");
        ONSControls.dpadAnimation(null);
    }
    this._controlsCanvas.stage.addChild(container);
    this._dPadContainer = container;
    this._preloadDPADStates();
}
//=============================================================================
// * LB/RB Buttons
//=============================================================================
ONSControls.createBumpers = function() {
    const LBsprite = new PIXI.Sprite.fromImage("img/system/controls/omori_lb_button.png");
    const RBsprite = new PIXI.Sprite.fromImage("img/system/controls/omori_rb_button.png");
    LBsprite.anchor.set(0.5);
    LBsprite.interactive = true;
    RBsprite.anchor.set(0.5);
    RBsprite.interactive = true;
    this._controlsCanvas.stage.addChild(LBsprite);
    this._controlsCanvas.stage.addChild(RBsprite);
    this._LBsprite = LBsprite;
    this._RBsprite = RBsprite;
}
//=============================================================================
// * Show Button
//=============================================================================
ONSControls.createAdditionalButtons = function() {
    const showButton = new PIXI.Sprite.fromImage("img/system/controls/omori_show_button.png");
    showButton.anchor.set(0.5);
    showButton.interactive = true;
    this._controlsCanvas.stage.addChild(showButton);
    this._showButton = showButton;
}
//=============================================================================
// * Edit Mode Interface
//=============================================================================
ONSControls.createEditModeInterface = function() {
    const headerText = new PIXI.Text("编辑模式", {
        fontFamily: ONSControls.options.primaryFont,
        fontSize: Math.round(this._controlsCanvas.screen.height / 20),
        fill: 0xaaaaaa,
        align: 'center'
    });
    const tipText = new PIXI.Text("在此模式下，您可以在屏幕上自由移动控制元素。\n要退出此模式，请在Android设备上按\"返回\"按钮。", {
        fontFamily: ONSControls.options.additionalFont,
        fontSize: Math.round(this._controlsCanvas.screen.height / 32),
        fill: 0xaaaaaa,
        align: 'center'
    });
    headerText.anchor.set(0.5);
    headerText.visible = false;
    headerText.addChild(tipText);
    tipText.anchor.set(0.5);
    tipText.y = 64;
    this._controlsCanvas.stage.addChild(headerText);
    this._editModeText = headerText;
}
//=============================================================================
// * Check idle animation (spinning buttons)
//=============================================================================
ONSControls.idleAnimation = function() {
    ONSControls._buttonsContainer.rotation -= 0.1;
    ONSControls._dPadContainer.rotation += 0.1;
    ONSControls._LBsprite.rotation += 0.1;
    ONSControls._RBsprite.rotation -= 0.1;
    ONSControls._showButton.rotation += 0.1;
}
//=============================================================================
// * Check idle animation (spinning buttons)
//=============================================================================
ONSControls.isIdlePlaying = false;
ONSControls.idleDisabled = false;
//=============================================================================
// * Play idle animation (spinning buttons)
//=============================================================================
ONSControls.playIdleAnimation = function() {
    if (!ONSControls.isIdlePlaying && !ONSControls.idleDisabled) {
        ONSControls.isIdlePlaying = true;
        ONSControls._controlsCanvas.ticker.add(ONSControls.idleAnimation);
    }
}
//=============================================================================
// * Stop idle animation (spinning buttons)
//=============================================================================
ONSControls.stopIdleAnimation = function() {
    ONSControls._controlsCanvas.ticker.remove(ONSControls.idleAnimation);
    ONSControls._buttonsContainer.rotation = 0;
    ONSControls._dPadContainer.rotation = 0;
    ONSControls._LBsprite.rotation = 0;
    ONSControls._RBsprite.rotation = 0;
    ONSControls._showButton.rotation = 0;
}
//=============================================================================
// * Reset idle animation timer
//=============================================================================
ONSControls.resetIdleAnimation = function() {
    if (ONSControls._idleInterval !== undefined) {
        ONSControls.stopIdleAnimation();
        clearInterval(ONSControls._idleInterval);
        if (!ONSControls.idleDisabled) {
            ONSControls._idleInterval = setInterval(ONSControls.playIdleAnimation, 300000);
        }
    }
}
//=============================================================================
// * Send event to virtual controller
//=============================================================================
ONSControls.sendEvent = function(event, button) {
    const key = VirtualGamepad.keys.find((element) => element.name == button);
    if (event.type === "pointerdown") {
        console.log(`ONSControls: Pointer down for ${button}`); // Remove in release
    }
    VirtualGamepad.gamepad.buttons[key.code].pressed = event.type === "pointerdown" ? true : false
}
//=============================================================================
// * Toggle controls
//=============================================================================
ONSControls.toggle = function(neededState = null) {
    const elements = [
        ONSControls._buttonsContainer, ONSControls._dPadContainer, 
        ONSControls._LBsprite, ONSControls._RBsprite
    ]
    for (elem of elements) {
        if (elem.visible || neededState === false) {
            elem.visible = false;
            ONSControls.idleDisabled = true;
        } else {
            elem.visible = true;
            ONSControls.idleDisabled = false;
        }
    }
}
//=============================================================================
// * Update controls parameters
//=============================================================================
ONSControls.updateButtons = function() {

    // Update canvas
    const canvas = this._controlsCanvas;
    canvas.view.style.position = "absolute";
    canvas.view.style.left = 0;
    canvas.view.style.right = 0;
    canvas.view.style.down = 0;
    canvas.view.style.top = 0;

    // Update A/B/X/Y
    const buttonsSize = ConfigManager.ONSConfig.buttonsSize;
    const container = this._buttonsContainer;
    const buttons = container.children;
    for (btn of buttons) {
        btn.width = buttonsSize;
        btn.height = buttonsSize;
        btn.interactive = true;
        btn.alpha = ConfigManager.ONSConfig.buttonsOpacity;
    }
    buttons[0].y = buttonsSize / 2 + buttonsSize / 4;
    buttons[1].x = -(buttonsSize / 2 + buttonsSize / 4);
    buttons[2].x = buttonsSize / 2 + buttonsSize / 4;
    buttons[3].y = -(buttonsSize / 2 + buttonsSize / 4);
    container.width = buttonsSize * 2;
    container.height = buttonsSize * 2;
    container.position.set(ConfigManager.ONSConfig.buttonsX, ConfigManager.ONSConfig.buttonsY);
    container.position = this.toSafeArea(container.position, container);

    // Update DPAD
    const dPadSize = ConfigManager.ONSConfig.dPadSize;
    const dpadContainer = this._dPadContainer;
    dpadContainer.width = dPadSize;
    dpadContainer.height = dPadSize;
    dpadContainer.alpha = ConfigManager.ONSConfig.buttonsOpacity;
    dpadContainer.position.set(ConfigManager.ONSConfig.dPadX, ConfigManager.ONSConfig.dPadY);
    dpadContainer.position = this.toSafeArea(dpadContainer.position, dpadContainer);

    // Update LB/RB
    const LBsprite = this._LBsprite;
    const RBsprite = this._RBsprite;
    LBsprite.position.set(ConfigManager.ONSConfig.LBX, ConfigManager.ONSConfig.LBY);
    LBsprite.position = this.toSafeArea(LBsprite.position, LBsprite);
    LBsprite.alpha = ConfigManager.ONSConfig.buttonsOpacity;
    LBsprite.width = ConfigManager.ONSConfig.bumpersWidth;
    LBsprite.height = ConfigManager.ONSConfig.bumpersHeight;
    RBsprite.position.set(ConfigManager.ONSConfig.RBX, ConfigManager.ONSConfig.RBY);
    RBsprite.position = this.toSafeArea(RBsprite.position, RBsprite);
    RBsprite.alpha = ConfigManager.ONSConfig.buttonsOpacity;
    RBsprite.width = ConfigManager.ONSConfig.bumpersWidth;
    RBsprite.height = ConfigManager.ONSConfig.bumpersHeight;

    // Update additional
    const showButton = this._showButton;
    showButton.position.set(ConfigManager.ONSConfig.showX, ConfigManager.ONSConfig.showY);
    showButton.position = this.toSafeArea(showButton.position, showButton);
    showButton.width = ConfigManager.ONSConfig.additonalSize;
    showButton.height = ConfigManager.ONSConfig.additonalSize;
    showButton.alpha = ConfigManager.ONSConfig.buttonsOpacity / 2;
    console.log("ONSControls: Controls updated");
}
//=============================================================================
// * Clamp to safe area
//=============================================================================
ONSControls.toSafeArea = function(position, element) {
    // 禁用safe area限制，允许按钮移动到屏幕外
    return position;
}
//=============================================================================
// * Preload all dpad states to avoid dpad blink
//=============================================================================
ONSControls._preloadDPADStates = function() {
    var states = [
        new PIXI.Texture.fromImage(`img/system/controls/omori_dpad_up.png`),
        new PIXI.Texture.fromImage(`img/system/controls/omori_dpad_left.png`),
        new PIXI.Texture.fromImage(`img/system/controls/omori_dpad_right.png`),
        new PIXI.Texture.fromImage(`img/system/controls/omori_dpad_down.png`),
        new PIXI.Texture.fromImage(`img/system/controls/omori_dpad.png`),
    ];

    for (state of states) {
        this._dPadContainer.setTexture(state);
    }
}
//=============================================================================
// * Set button pressing animation
//=============================================================================
ONSControls.pressAnimation = function(element, is_pressed) {
    const orig_opacity = ConfigManager.ONSConfig.buttonsOpacity;
    element.alpha = is_pressed ? orig_opacity / 1.5 : orig_opacity;
}
//=============================================================================
// * Set dpad pressing animation
//=============================================================================
ONSControls.dpadAnimation = function(direction) {
    if (direction !== null) {
        var texture = new PIXI.Texture.fromImage(`img/system/controls/omori_dpad_${direction}.png`);
        this._dPadContainer.setTexture(texture);
    } else {
        var base_texture = new PIXI.Texture.fromImage("img/system/controls/omori_dpad.png");
        this._dPadContainer.setTexture(base_texture);
    }
}
//=============================================================================
// * Setup events for button
//=============================================================================
ONSControls.setupButton = function(element, button) {
    element.on("pointerdown", (event) => {this.sendEvent(event, button); 
        ONSControls.pressAnimation(element, true);})
    .on("pointerup", (event) => {this.sendEvent(event, button); 
        ONSControls.pressAnimation(element, false);})
    .on("pointerupoutside", (event) => {this.sendEvent(event, button); 
        ONSControls.pressAnimation(element, false);});
}
//=============================================================================
// * Setup controls touch events
//=============================================================================
ONSControls.setupInteractive = function () {

    // Canvas
    this._idleInterval = setInterval(ONSControls.playIdleAnimation, 300000);
    this._controlsCanvas.stage.on("pointerdown", ONSControls.resetIdleAnimation);

    // A/B/X/Y
    const buttons = this._buttonsContainer.children;
    this.setupButton(buttons[0], "BUTTON_A");
    this.setupButton(buttons[1], "BUTTON_X");
    this.setupButton(buttons[2], "BUTTON_B");
    this.setupButton(buttons[3], "BUTTON_Y");
    for (btn of buttons) {
        btn.hitArea = new PIXI.Circle(0, 0, 40);
    }

    // DPAD
    const container = this._dPadContainer;
    container.on("pointerup", () => {container.upAll()});
    container.on("pointerupoutside", () => {container.upAll()});
    container.on("pointerdown", (event) => {
        var x = event.data.global.x - this._dPadContainer.x;
        var y = event.data.global.y - this._dPadContainer.y;
        container.down(x, y);
    })
    container.on("pointermove", (event) => {
        if (container.pressed) {
            // DPad pressed, set up button
            var x = event.data.global.x - this._dPadContainer.x;
            var y = event.data.global.y - this._dPadContainer.y;
            container.down(x, y);
        } else {
            // DPad not pressed, clear all buttons
            container.upAll();
        }
    });

    // LB/RB
    this.setupButton(this._LBsprite, "BUTTON_LB");
    this.setupButton(this._RBsprite, "BUTTON_RB");

    // Show button
    this._showButton.on("pointerdown", this.toggle);
}
//=============================================================================
// * Get all buttons
//=============================================================================
ONSControls.getControlElements = function() {
    return [
        this._dPadContainer, this._LBsprite, 
        this._RBsprite, this._showButton, this._buttonsContainer
    ];
}
//=============================================================================
// * Clear all controls touch events
//=============================================================================
ONSControls.clearInteractive = function() {
    this._controlsCanvas.stage.removeAllListeners();
    for (child of this._buttonsContainer.children) {
        child.removeAllListeners();
    }
    for (elem of this.getControlElements()) {
        elem.removeAllListeners();
    }
    this._dPadContainer.upAll();
    clearInterval(this._idleInterval);
    // Clear status of VirtualGamepad
    VirtualGamepad.clearState();
}
//=============================================================================
// * Setup drag'n drop events for element
//=============================================================================
ONSControls.editButtonBressed = false;
ONSControls.setupDragNDrop = function(element) {
    var orig_alpha = element.alpha;

    var onStart = function(event) {
        if (ONSControls.editButtonBressed === false) {
            ONSControls.editButtonBressed = true;
            element.alpha = orig_alpha / 2;
            ONSControls._controlsCanvas.stage.on("pointermove", onMove);
        }
    }
    var onMove = function(event) {
        if (element) {
            element.parent.toLocal(ONSControls.toSafeArea(event.data.global, element), null, element.position);
            ConfigManager.ONSConfig.customPos = true;
        };
    }
    var onEnd = function(event) {
        if (element) {
            ONSControls._controlsCanvas.stage.off("pointermove", onMove);
            ONSControls.editButtonBressed = false;
            element.alpha = orig_alpha;
        };
    }
    element.on("pointerdown", onStart);
    this._controlsCanvas.stage.on("pointerup", onEnd);
    this._controlsCanvas.stage.on("pointerupoutside", onEnd);
}
//=============================================================================
// * Disable native RPG Maker touch support
//=============================================================================
ONSControls.disableTouch = function() {
    TouchInput.update = function() {return;};
}
//=============================================================================
// * Replace default cordova's backbutton event
//=============================================================================
ONSControls.replaceBackEvent = function() {
    document.addEventListener("backbutton", function(event){
        event.preventDefault();
        ONSControls.closeEditMode();
    });
}
//=============================================================================
// * Open Edit Mode
//=============================================================================
ONSControls.openEditMode = function() {
    if (Graphics._canvas.hidden === false) {
        Graphics._canvas.hidden = true;
        this.idleDisabled = true;
        this.clearInteractive();
        this._buttonsContainer.interactive = true;
        for (elem of this.getControlElements()) {
            this.setupDragNDrop(elem);
        }
        this._buttonsContainer.children[0].hitArea = new PIXI.Circle(0, -50, 100);
        this._editModeText.visible = true;
        this._editModeText.x = this._controlsCanvas.screen.width / 2;
        this._editModeText.y = this._controlsCanvas.screen.height / 2;
    }
}
//=============================================================================
// * Close Edit Mode
//=============================================================================
ONSControls.closeEditMode = function() {
    this._editModeText.visible = false;
    Graphics._canvas.hidden = false;
    this.idleDisabled = false;
    this.clearInteractive();
    this.setupInteractive();
    ConfigManager.ONSConfig.saveButtonsPosition();
}
//=============================================================================
// * Handle connected physical gamepad and hide ONSControls
//=============================================================================
ONSControls.gamepadHandler = function() {
    if (VirtualGamepad._originalNavigator.call(navigator)[0] !== null && 
        VirtualGamepad._originalNavigator.call(navigator).length !== 0) {
        this.toggle(false);
    }
    window.addEventListener("gamepadconnected", () => {this.toggle(false);});
    window.addEventListener("gamepaddisconnected", () => {this.toggle(true);});
}
//=============================================================================
// * Handle connected physical keyboard and hide ONSControls on keypress
//=============================================================================
ONSControls.keyboardHandler = function() {
    document.addEventListener('keydown', () => {this.toggle(false);});
}
//=============================================================================
// * Disable idle animation on locked device
//=============================================================================
ONSControls.cordovaHandler = function() {
    document.addEventListener("pause", () => {
        console.log("Idle stopped");
        ONSControls.idleDisabled = true;
        ONSControls.resetIdleAnimation();
    });
    document.addEventListener("resume", () => {
        console.log("Idle started");
        ONSControls.idleDisabled = false;
        ONSControls.resetIdleAnimation();
    });
}





//=============================================================================
// ** VirtualGamepad
//=============================================================================
class VirtualGamepad {};
//=============================================================================
// * Virtual gamepad mapping
//=============================================================================
VirtualGamepad.keys = [
    {name: "BUTTON_A", code: 0},
    {name: "BUTTON_B", code: 1},
    {name: "BUTTON_X", code: 2},
    {name: "BUTTON_Y", code: 3},
    {name: "BUTTON_LB", code: 4},
    {name: "BUTTON_RB", code: 5},
    {name: "BUTTON_LT", code: 6},
    {name: "BUTTON_RT", code: 7},
    {name: "BUTTON_SELECT", code: 8},
    {name: "BUTTON_START", code: 9},
    {name: "DPAD_UP", code: 12},
    {name: "DPAD_DOWN", code: 13},
    {name: "DPAD_LEFT", code: 14},
    {name: "DPAD_RIGHT", code: 15},
    {name: "BACK", code: 16}
]
//=============================================================================
// * Define gamepad
//=============================================================================
VirtualGamepad.gamepad = {
    id: ONSControls.options.gamepadId || 'builtin',
    index: ONSControls.options.gamepadIndex || 0,
    connected: true,
    timestamp: Math.floor(Date.now() / 1000),
    mapping: "standard",
    axes: [0, 0, 0, 0],
    buttons: Array.apply(0, Array(17)).map(function () {
        return {
            pressed: false,
            touched: false,
            value: 0
        };
    })
}
//=============================================================================
// * Replace first gamepad with virtual
//=============================================================================
VirtualGamepad._originalNavigator = navigator.getGamepads;
VirtualGamepad.updateNavigator = function() {
    var gamepads = [];
    for (gamepad of VirtualGamepad._originalNavigator.call(navigator)) {
        gamepads.push(gamepad);
    }
    navigator.getGamepads = function() {
        var index = ONSControls.options.gamepadIndex;
        gamepads[index] = VirtualGamepad.gamepad;
        return gamepads;
    }
    console.log("ONSControls: Navigator updated");
}
//=============================================================================
// * Connect virtual gamepad
//=============================================================================
VirtualGamepad.connect = function () {
    this.updateNavigator();
    console.log(`ONSControls: Virtual gamepad connected with index ${this.gamepad.index}`);
}
//=============================================================================
// * Disconnect virtual gamepad
//=============================================================================
VirtualGamepad.disconnect = function () {
    this.clearState();
    //VirtualGamepad.originalNavigator.getGamepads.call();
    console.log(`ONSControls: Virtual gamepad disconnected with index ${this.gamepad.index}`);
}
//=============================================================================
// * Clear state of all buttons
//=============================================================================
VirtualGamepad.clearState = function() {
    this.gamepad.axes = [0, 0, 0, 0];
    this.gamepad.buttons = Array.apply(0, Array(17)).map(function () {
        return {
            pressed: false,
            touched: false,
            value: 0
        };
    })
}
//=============================================================================
// * Initialize virtual gamepad
//=============================================================================
VirtualGamepad.initialize = function() {
    this._originalNavigator.call(navigator);
    this.connect();
    window.addEventListener('gamepadconnected', this.updateNavigator);
    window.addEventListener('gamepaddisconnected', this.updateNavigator);
}





//=============================================================================
// ** ConfigManager
//=============================================================================

ONSControls.configManager = function() {
//=============================================================================
// * Class Variables
//=============================================================================
ConfigManager.ONSConfig = ConfigManager.ONSConfig || {};
ConfigManager.ONSConfig.customPos = ConfigManager.ONSConfig.customPos || false;
ConfigManager.ONSConfig.buttonsScale = ConfigManager.ONSConfig.buttonsScale || ONSControls.options.buttonsScale;
ConfigManager.ONSConfig.buttonsOpacity = ConfigManager.ONSConfig.buttonsOpacity || ONSControls.options.buttonsOpacity;
ConfigManager.ONSConfig.safeArea = ConfigManager.ONSConfig.safeArea || 1;
ConfigManager.ONSConfig.buttonsSize = ConfigManager.ONSConfig.buttonsSize || ONSControls._controlsCanvas.vh(0.18) * ConfigManager.ONSConfig.buttonsScale;
ConfigManager.ONSConfig.buttonsX = ConfigManager.ONSConfig.buttonsX || ONSControls._controlsCanvas.screen.width * 4.0;
ConfigManager.ONSConfig.buttonsY = ConfigManager.ONSConfig.buttonsY || ONSControls._controlsCanvas.screen.height - ConfigManager.ONSConfig.buttonsSize;
ConfigManager.ONSConfig.dPadSize = ConfigManager.ONSConfig.dPadSize || ONSControls._controlsCanvas.vh(0.36) * ConfigManager.ONSConfig.buttonsScale;
ConfigManager.ONSConfig.dPadX = ConfigManager.ONSConfig.dPadX || ConfigManager.ONSConfig.dPadSize / 2;
ConfigManager.ONSConfig.dPadY = ConfigManager.ONSConfig.dPadY || ONSControls._controlsCanvas.screen.height - ConfigManager.ONSConfig.dPadSize / 2;
ConfigManager.ONSConfig.bumpersOffsetX = ConfigManager.ONSConfig.bumpersOffsetX || 16;
ConfigManager.ONSConfig.bumpersOffsetY = ConfigManager.ONSConfig.bumpersOffsetY || ONSControls._controlsCanvas.vh(0.30);
ConfigManager.ONSConfig.bumpersWidth = ConfigManager.ONSConfig.bumpersWidth || ONSControls._controlsCanvas.vh(0.188) * ConfigManager.ONSConfig.buttonsScale;
ConfigManager.ONSConfig.bumpersHeight = ConfigManager.ONSConfig.bumpersHeight || ONSControls._controlsCanvas.vh(0.12) * ConfigManager.ONSConfig.buttonsScale;
ConfigManager.ONSConfig.LBX = ConfigManager.ONSConfig.LBX || ConfigManager.ONSConfig.bumpersOffsetX + ConfigManager.ONSConfig.bumpersWidth / 2;
ConfigManager.ONSConfig.LBY = ConfigManager.ONSConfig.LBY || ConfigManager.ONSConfig.bumpersOffsetY + ConfigManager.ONSConfig.bumpersHeight / 2;
ConfigManager.ONSConfig.RBX = ConfigManager.ONSConfig.RBX || ONSControls._controlsCanvas.screen.width;
ConfigManager.ONSConfig.RBY = ConfigManager.ONSConfig.RBY || ConfigManager.ONSConfig.bumpersOffsetY + ConfigManager.ONSConfig.bumpersHeight / 2;
ConfigManager.ONSConfig.additonalSize = ConfigManager.ONSConfig.additonalSize || ONSControls._controlsCanvas.vh(0.06) * ConfigManager.ONSConfig.buttonsScale;
ConfigManager.ONSConfig.showX = ConfigManager.ONSConfig.showX || ONSControls._controlsCanvas.screen.width * 1.75;
ConfigManager.ONSConfig.showY = ConfigManager.ONSConfig.showY || ONSControls._controlsCanvas.screen.height * 0.15;
//=============================================================================
// * Restore defaults
//=============================================================================
var _ConfigManager_restoreDefaultConfig = ConfigManager.restoreDefaultConfig;
ConfigManager.restoreDefaultConfig = function () {
    _ConfigManager_restoreDefaultConfig.apply(this, arguments);
    const fs = require("fs");
    const path = require('path');
    var base = path.dirname(process.mainModule.filename);
    base = path.join(base, 'save/');
    if (fs.existsSync(base + "config.rpgsave")) { fs.unlinkSync(base + "config.rpgsave"); }
    this.ONSConfig.customPos = false;
    this.ONSConfig.buttonsScale = ONSControls.options.buttonsScale;
    this.ONSConfig.buttonsOpacity = ONSControls.options.buttonsOpacity;
    this.ONSConfig.safeArea = 1;
    this.ONSConfig.buttonsSize = ONSControls._controlsCanvas.vh(0.18) * this.ONSConfig.buttonsScale;
    this.ONSConfig.buttonsX = ONSControls._controlsCanvas.screen.width * 4.0;
    this.ONSConfig.buttonsY = ONSControls._controlsCanvas.screen.height - this.ONSConfig.buttonsSize;
    this.ONSConfig.dPadSize = ONSControls._controlsCanvas.vh(0.36) * this.ONSConfig.buttonsScale;
    this.ONSConfig.dPadX = this.ONSConfig.dPadSize / 2;
    this.ONSConfig.dPadY = ONSControls._controlsCanvas.screen.height - this.ONSConfig.dPadSize / 2;
    this.ONSConfig.bumpersOffsetX = 16;
    this.ONSConfig.bumpersOffsetY = ONSControls._controlsCanvas.vh(0.30);
    this.ONSConfig.bumpersWidth = ONSControls._controlsCanvas.vh(0.188) * this.ONSConfig.buttonsScale;
    this.ONSConfig.bumpersHeight = ONSControls._controlsCanvas.vh(0.12) * this.ONSConfig.buttonsScale;
    this.ONSConfig.LBX = this.ONSConfig.bumpersOffsetX + this.ONSConfig.bumpersWidth / 2;
    this.ONSConfig.LBY = this.ONSConfig.bumpersOffsetY + this.ONSConfig.bumpersHeight / 2;
    this.ONSConfig.RBX = ONSControls._controlsCanvas.screen.width;
    this.ONSConfig.RBY = this.ONSConfig.bumpersOffsetY + this.ONSConfig.bumpersHeight / 2;
    this.ONSConfig.additionalOffset = ONSControls._controlsCanvas.vh(0.03);
    this.ONSConfig.additonalSize = ONSControls._controlsCanvas.vh(0.06) * this.ONSConfig.buttonsScale;
    this.ONSConfig.showX = ONSControls._controlsCanvas.screen.width * 1.75;
    this.ONSConfig.showY = ONSControls._controlsCanvas.screen.height * 0.15;
    this.applyData(ConfigManager);
    this.ONSConfig.updateData();
    VirtualGamepad.clearState();
    let needsRestore = confirm(LanguageManager.languageData().text.System.plugins.optionsMenu.alertMessages["restoreGeneral"]);
    if (!!needsRestore) { DataManager._restoreGlobalInfo(); }
}
//=============================================================================
// * Save buttons position to config
//=============================================================================
ConfigManager.ONSConfig.saveButtonsPosition = function() {
    this.buttonsX = ONSControls._buttonsContainer.x;
    this.buttonsY = ONSControls._buttonsContainer.y;
    this.dPadX = ONSControls._dPadContainer.x;
    this.dPadY = ONSControls._dPadContainer.y;
    this.LBX = ONSControls._LBsprite.x;
    this.LBY = ONSControls._LBsprite.y;
    this.RBX = ONSControls._RBsprite.x;
    this.RBY = ONSControls._RBsprite.y;
    this.showX = ONSControls._showButton.x;
    this.showY = ONSControls._showButton.y;
}
//=============================================================================
// * Update all controls data
//=============================================================================
ConfigManager.ONSConfig.updateData = function() {
    this.customPos = this.customPos;
    this.buttonsScale = this.buttonsScale;
    this.buttonsOpacity = this.buttonsOpacity;
    this.safeArea = this.safeArea;
    this.buttonsSize = ONSControls._controlsCanvas.vh(0.18) * this.buttonsScale;
    this.dPadSize = ONSControls._controlsCanvas.vh(0.36) * this.buttonsScale;
    this.bumpersOffsetX = this.bumpersOffsetX;
    this.bumpersOffsetY = this.bumpersOffsetY;
    this.bumpersWidth = ONSControls._controlsCanvas.vh(0.188) * this.buttonsScale;
    this.bumpersHeight = ONSControls._controlsCanvas.vh(0.12) * this.buttonsScale;
    this.additonalSize = ONSControls._controlsCanvas.vh(0.06) * this.buttonsScale;
    if (this.customPos === false) {
        this.buttonsX = ONSControls._controlsCanvas.screen.width * 4.0;
        this.buttonsY = ONSControls._controlsCanvas.screen.height - this.buttonsSize;
        this.dPadX = this.dPadSize / 2;
        this.dPadY = ONSControls._controlsCanvas.screen.height - this.dPadSize / 2;
        this.LBX = this.bumpersOffsetX + this.bumpersWidth / 2;
        this.LBY = this.bumpersOffsetY + this.bumpersHeight / 2;
        this.RBX = ONSControls._controlsCanvas.screen.width;
        this.RBY = this.bumpersOffsetY + this.bumpersHeight / 2;
        this.additionalOffset = this.additionalOffset;
        this.showX = ONSControls._controlsCanvas.screen.width * 1.75;
        this.showY = ONSControls._controlsCanvas.screen.height * 0.15;
    }
    ONSControls.updateButtons();
}
}
//=============================================================================
// * Original functions
//=============================================================================
var ConfigManager_makeData = ConfigManager.makeData;
var ConfigManager_applyData = ConfigManager.applyData;
//=============================================================================
// * Make Data
//=============================================================================
var _ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function () {
    var config = _ConfigManager_makeData.apply(this, arguments);
    config.ONSConfig = {};
    config.ONSConfig.customPos = this.ONSConfig.customPos;
    config.ONSConfig.buttonsScale = this.ONSConfig.buttonsScale;
    config.ONSConfig.buttonsOpacity = this.ONSConfig.buttonsOpacity;
    config.ONSConfig.safeArea = this.ONSConfig.safeArea;
    config.ONSConfig.buttonsSize = this.ONSConfig.buttonsSize;
    config.ONSConfig.buttonsX = this.ONSConfig.buttonsX;
    config.ONSConfig.buttonsY = this.ONSConfig.buttonsY;
    config.ONSConfig.dPadSize = this.ONSConfig.dPadSize;
    config.ONSConfig.dPadX = this.ONSConfig.dPadX;
    config.ONSConfig.dPadY = this.ONSConfig.dPadY;
    config.ONSConfig.bumpersWidth = this.ONSConfig.bumpersWidth;
    config.ONSConfig.bumpersHeight = this.ONSConfig.bumpersHeight;
    config.ONSConfig.bumpersOffsetX = this.ONSConfig.bumpersOffsetX;
    config.ONSConfig.bumpersOffsetY = this.ONSConfig.bumpersOffsetY;
    config.ONSConfig.LBX = this.ONSConfig.LBX;
    config.ONSConfig.LBY = this.ONSConfig.LBY;
    config.ONSConfig.RBX = this.ONSConfig.RBX;
    config.ONSConfig.RBY = this.ONSConfig.RBY;
    config.ONSConfig.additonalSize = this.ONSConfig.additonalSize;
    config.ONSConfig.showX = this.ONSConfig.showX;
    config.ONSConfig.showY = this.ONSConfig.showY;
    return config;
}
//=============================================================================
// * Apply Data
//=============================================================================
var _ConfigManager_applyData = ConfigManager.applyData; 
ConfigManager.applyData = function (config) {
    _ConfigManager_applyData.apply(this, arguments);
    try {
        this.ONSConfig = config.ONSConfig;
        this.ONSConfig.customPos = config.ONSConfig.customPos;
        this.ONSConfig.buttonsScale = config.ONSConfig.buttonsScale;
        this.ONSConfig.buttonsOpacity = config.ONSConfig.buttonsOpacity;
        this.ONSConfig.safeArea = config.ONSConfig.safeArea;
        this.ONSConfig.buttonsSize = config.ONSConfig.buttonsSize;
        this.ONSConfig.buttonsX = config.ONSConfig.buttonsX;
        this.ONSConfig.buttonsY = config.ONSConfig.buttonsY;
        this.ONSConfig.dPadSize = config.ONSConfig.dPadSize;
        this.ONSConfig.dPadX = config.ONSConfig.dPadX;
        this.ONSConfig.dPadY = config.ONSConfig.dPadY;
        this.ONSConfig.bumpersWidth = config.ONSConfig.bumpersWidth;
        this.ONSConfig.bumpersHeight = config.ONSConfig.bumpersHeight;
        this.ONSConfig.bumpersOffsetX = config.ONSConfig.bumpersOffsetX;
        this.ONSConfig.bumpersOffsetY = config.ONSConfig.bumpersOffsetY;
        this.ONSConfig.LBX = config.ONSConfig.LBX;
        this.ONSConfig.LBY = config.ONSConfig.LBY;
        this.ONSConfig.RBX = config.ONSConfig.RBX;
        this.ONSConfig.RBY = config.ONSConfig.RBY;
        this.ONSConfig.additonalSize = config.ONSConfig.additonalSize;
        this.ONSConfig.showX = config.ONSConfig.showX;
        this.ONSConfig.showY = config.ONSConfig.showY;
    } catch {
        console.log("ONSControls loaded in first time, skip config reading.");
    }
}





//=============================================================================
// ** Window_OmoMenuOptionsONSControls
//-----------------------------------------------------------------------------
// The window for showing ONSControls options in the OMORI options menu
//=============================================================================
function Window_OmoMenuOptionsONSControls() { this.initialize.apply(this, arguments); }
Window_OmoMenuOptionsONSControls.prototype = Object.create(Window_Selectable.prototype);
Window_OmoMenuOptionsONSControls.prototype.constructor = Window_OmoMenuOptionsONSControls;
//=============================================================================
// * Object Initialization
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.initialize = function () {
    // Make Options List
    this.makeOptionsList();
    // Super Call
    Window_Selectable.prototype.initialize.call(this, 0, 0, this.windowWidth(), this.windowHeight());
    // Create Option Bars
    this.createOptionBars();
    this.select(0);
    // Refresh
    this.refresh();
};
//=============================================================================
// * Settings
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.isUsingCustomCursorRectSprite = function () { return true; };
Window_OmoMenuOptionsONSControls.prototype.standardPadding = function () { return 8; }
Window_OmoMenuOptionsONSControls.prototype.windowWidth = function () { return Graphics.width - 20; };
Window_OmoMenuOptionsONSControls.prototype.windowHeight = function () { return 318; }
Window_OmoMenuOptionsONSControls.prototype.maxItems = function () { return this._optionsList.length; };
Window_OmoMenuOptionsONSControls.prototype.maxCols = function () { return 1; };
Window_OmoMenuOptionsONSControls.prototype.itemHeight = function () { return 75; };
Window_OmoMenuOptionsONSControls.prototype.spacing = function () { return 5; };
Window_OmoMenuOptionsONSControls.prototype.customCursorRectXOffset = function () { return 15; }
Window_OmoMenuOptionsONSControls.prototype.customCursorRectYOffset = function () { return -18; }
//=============================================================================
// * Height
//=============================================================================
Object.defineProperty(Window_OmoMenuOptionsONSControls.prototype, 'height', {
    get: function () { return this._height; },
    set: function (value) {
        this._height = value;
        this._refreshAllParts();
        // If Option Sprites Exist
        if (this._optionSprites) {
            for (var i = 0; i < this._optionSprites.length; i++) {
                var sprite = this._optionSprites[i];
                sprite.visible = value >= (sprite.y + sprite.height)
            };
        }
    },
    configurable: true
});
//=============================================================================
// * Create Option Bars
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.createOptionBars = function () {
    // Initialize Option Sprites
    this._optionSprites = [];
    // Create Bitmap
    var bitmap = new Bitmap(400, 40);
    // Iterate from 0 to 100
    for (var i = 0; i < 100; i++) {
        var x = (i + 4) + (i % 2);;
        var x = (i * 4);
        bitmap.fillRect(x, 0, 2, 20, 'rgba(100, 100, 100, 1)');
        bitmap.fillRect(x, 20, 2, 20, 'rgba(255, 255, 255, 1)');
    };
    // Create Sprites
    for (var i = 0; i < 6; i++) {
        var sprite = new Sprite(bitmap);
        var index = Math.floor(i / 2);
        var rect = this.itemRect(index);
        sprite.x = rect.x + 60;
        sprite.y = rect.y + 50;
        // sprite.y += (i % 2) * 20;
        sprite.setFrame(0, (i % 2) * 20, bitmap.width, 20);
        this._optionSprites.push(sprite);
        this.addChild(sprite);
    };
};
//=============================================================================
// * Make Options List
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.makeOptionsList = function () {
    // Get Text
    //var text = LanguageManager.getPluginText('optionsMenu', 'audio');
    var text = {
        buttonsScale: {help: "更改屏幕上的控件缩放。", text: "控制比例", isBar: true, minValue: 20, maxValue: 500},
        buttonsOpacity: {help: "更改屏幕控制不透明度。", text: "控制不透明度", isBar: true, minValue: 0, maxValue: 100},
        safeArea: {help: "更改屏幕控件的安全区域大小。", text: "安全区", isBar: true, minValue: 10, maxValue: 100},
        editMenu: {help: "按DPad上的左键或右键,打开菜单.", text: "打开编辑模式", isBar: false}
    }
    // Get Config
    var config = ConfigManager;
    // Get Options
    var options = Object.keys(text);
    // Initialize Options List
    this._optionsList = [];
    // Go Through Options
    for (var i = 0; i < options.length; i++) {
        // Get Name
        var name = options[i];
        // Get Data
        var data = text[name];
        // Add Option
        if (data.isBar) {
            this._optionsList.push({ header: data.text + ':', config: name, option: ConfigManager.ONSConfig[name] * 100, helpText: data.help, isBar: data.isBar, minValue: data.minValue, maxValue: data.maxValue });
        } else {
            this._optionsList.push({ header: data.text, config: name, helpText: data.help, isBar: data.isBar});
        }
    };
}
//=============================================================================
// * Draw Item
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.drawItem = function (index) {
    // Get Item Rect
    var rect = this.itemRect(index);
    // Get Data
    var data = this._optionsList[index];
    // If Data Exists
    if (data) {
        // Draw Header
        this.contents.drawText(data.header, rect.x + 50, rect.y, rect.width, 24);
        // Update option bar
        if (data.isBar) {
            this.updateOptionBar(index, data.option);
        }
    };
};
//=============================================================================
// * Call Update Help
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.callUpdateHelp = function () {
    // Run Original Function
    Window_Selectable.prototype.callUpdateHelp.call(this);
    // If Help Window Exist
    if (this._helpWindow) {
        this._helpWindow.setText(this._optionsList[this.index()].helpText);
    };
};
//=============================================================================
// * Cursor Right
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.cursorRight = function (wrap) {
    // Super Call
    Window_Selectable.prototype.cursorRight.call(this, wrap);
    // Get Data
    var data = this._optionsList[this.index()];
    // Get Data
    if (data) {
        var rate = Input.isLongPressed('right') ? 5 : 5
        data.option = Math.min(data.option + rate, data.maxValue);
        if (data.isBar) {
            this.updateOptionBar(this.index(), data.option);
        } else {
            ONSControls.openEditMode();
        }
    };
};
//=============================================================================
// * Cursor Left
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.cursorLeft = function (wrap) {
    // Super Call
    Window_Selectable.prototype.cursorLeft.call(this, wrap);
    // Get Data
    var data = this._optionsList[this.index()];
    // Get Data
    if (data) {
        var rate = Input.isLongPressed('left') ? 5 : 5
        data.option = Math.max(data.option - rate, data.minValue);
        if (data.isBar) {
            this.updateOptionBar(this.index(), data.option);
        } else {
            ONSControls.openEditMode();
        }
    };
};
//=============================================================================
// * Update option bar
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.updateOptionBar = function (index, option) {
    // Get Data
    var data = this._optionsList[index];
    // Get Back and Front Sprite
    var front = this._optionSprites[(index * 2) + 1];
    front._frame.width = option / (data.maxValue / 100) * 4;
    front._refresh();
    // Get Itm Rect
    var rect = this.itemRect(index);
    rect.x += 415; rect.y += 27; rect.width = 100; rect.height = 40;
    this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
    this.contents.drawText(Math.round(option) + '%', rect.x, rect.y, rect.width, rect.height, 'right');
    // Set Option
    ConfigManager.ONSConfig[data.config] = option / 100;
    ConfigManager.ONSConfig.updateData();
};
//=============================================================================
// * Add to options menus
//=============================================================================
Window_OmoMenuOptionsONSControls.prototype.add = function () {
    Scene_OmoMenuOptions.prototype.createONSControlsOptionsWindow = function () {
        // Create ONSControls Options Window
        this._onscontrolsOptionsWindow = new Window_OmoMenuOptionsONSControls();
        this._onscontrolsOptionsWindow.x = 10;
        this._onscontrolsOptionsWindow.y = 10;
        this._onscontrolsOptionsWindow.setHandler('cancel', this.onOptionWindowCancel.bind(this));
        this._onscontrolsOptionsWindow.height = 0;
        this._onscontrolsOptionsWindow.visible = false;
        this.addChild(this._onscontrolsOptionsWindow);
    };
    Scene_OmoMenuOptions.prototype.optionWindows = function () {
        return [this._generalOptionsWindow, this._audioOptionsWindow, this._onscontrolsOptionsWindow, this._controlOptionsWindow, this._systemOptionsWindow]
    }
    Scene_OmoriTitleScreen.prototype.createONSControlsOptionsWindow = function () {
        // Create ONSControls Options Window
        this._onscontrolsOptionsWindow = new Window_OmoMenuOptionsONSControls();
        this._onscontrolsOptionsWindow.setHandler('cancel', this.onOptionWindowCancel.bind(this));
        this._onscontrolsOptionsWindow.visible = false;
        this._optionsWindowsContainer.addChild(this._onscontrolsOptionsWindow);
    };
    Scene_OmoriTitleScreen.prototype.optionWindows = function () {
        return [this._generalOptionsWindow, this._audioOptionsWindow, this._onscontrolsOptionsWindow, this._controlOptionsWindow, this._systemOptionsWindow]
    }
    Scene_OmoMenuOptions.prototype.create = function () {
        // Super Call
        Scene_OmoMenuBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createStatusWindows();
        this.createGoldWindow();
      
        this.createGeneralOptionsWindow();
        this.createAudioOptionsWindow();
        this.createControllerOptionsWindow();
        this.createONSControlsOptionsWindow();
        this.createSystemOptionsWindow();
        this.createOptionCategoriesWindow();
        // this.createHelpWindow();
        this.createCommandWindow();
        this.createExitPromptWindow();
    };
    Scene_OmoMenuOptions.prototype.createSystemOptionsWindow = function () {
        // Create System Option Window
        this._systemOptionsWindow = new Window_OmoMenuOptionsSystem();
        this._systemOptionsWindow.x = 10;
        this._systemOptionsWindow.y = 10;
        this._systemOptionsWindow.setHandler('cancel', this.onOptionWindowCancel.bind(this));
        this._systemOptionsWindow.setHandler('restoreConfig', () => {
            ConfigManager.restoreDefaultConfig();
            this._controlOptionsWindow.makeOptionsList()
            this._generalOptionsWindow.makeOptionsList();
            this._audioOptionsWindow.makeOptionsList();
            this._onscontrolsOptionsWindow.makeOptionsList();
        
            this._controlOptionsWindow.refresh()
            this._controlOptionsWindow.select(0);
            this._generalOptionsWindow.refresh();
            this._generalOptionsWindow.select(0);
            this._audioOptionsWindow.refresh();
            this._onscontrolsOptionsWindow.refresh();
            this._systemOptionsWindow.refresh();
            this._systemOptionsWindow.activate();
            Input.clear();
        });
        this._systemOptionsWindow.setHandler('load', this.goToLoad.bind(this));
        this._systemOptionsWindow.setHandler('toTitleScreen', this.startExitPrompt.bind(this, 1));
        this._systemOptionsWindow.setHandler('exit', this.startExitPrompt.bind(this, 0));
        this.addChild(this._systemOptionsWindow);
      };
    Scene_OmoriTitleScreen.prototype.createSystemOptionsWindow = function () {
        // Create System Option Window
        this._systemOptionsWindow = new Window_OmoMenuOptionsSystem();
        this._systemOptionsWindow.setHandler('restoreConfig', () => {
            ConfigManager.restoreDefaultConfig();
            this._controlOptionsWindow.makeOptionsList()
            this._generalOptionsWindow.makeOptionsList();
            this._audioOptionsWindow.makeOptionsList();
            this._onscontrolsOptionsWindow.makeOptionsList();
        
            this._controlOptionsWindow.refresh()
            this._controlOptionsWindow.select(0);
            this._generalOptionsWindow.refresh();
            this._generalOptionsWindow.select(0);
            this._audioOptionsWindow.refresh();
            this._onscontrolsOptionsWindow.refresh();
            this._systemOptionsWindow.refresh();
            this._systemOptionsWindow.activate();
            Input.clear();
        });
        this._systemOptionsWindow.setHandler('cancel', this.onOptionWindowCancel.bind(this));
        this._systemOptionsWindow.setHandler('exit', this.startExitPrompt.bind(this));
        this._optionsWindowsContainer.addChild(this._systemOptionsWindow);
    };
    Window_OmoMenuOptionsCategory.prototype.standardPadding = function () { return 7; }
    Window_OmoMenuOptionsCategory.prototype.maxCols = function () { return 5; };
    Window_OmoMenuOptionsCategory.prototype.makeCommandList = function () {
        const localization = LanguageManager.getMessageData("XX_BLUE.Omori_Mainmenu_Sceneoptions").commands
        this.addCommand(localization[0], 'ok');
        this.addCommand(localization[1], 'ok');
        // this.addCommand('GAMEPLAY', 'ok');
        this.addCommand("触摸控制", 'ok');
        this.addCommand(localization[2], 'ok');
        this.addCommand(localization[3], 'ok');
    };
}





//=============================================================================
// * Plugin init
//=============================================================================
ONSControls.initialize = function() {
    console.log("ONSControls: Initialized");
    this.createCanvas();
    this.createEditModeInterface();
    this.configManager();
    // 强制重置自定义位置以应用新的默认值
    ConfigManager.ONSConfig.customPos = false;
    this.createButtons();
    this.createDPad();
    this.createBumpers();
    this.createAdditionalButtons();
    this.updateButtons();
    this.setupInteractive();
    this.disableTouch();
    this.replaceBackEvent();
    VirtualGamepad.initialize();
    Window_OmoMenuOptionsONSControls.prototype.add();
    this.gamepadHandler();
    this.keyboardHandler();
    this.cordovaHandler();
}