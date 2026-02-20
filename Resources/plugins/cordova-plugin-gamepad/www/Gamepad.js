cordova.define("cordova-plugin-gamepad.Gamepad", function(require, exports, module) {
/**
 * Gamepad API polyfill for Apache Cordova/PhoneGap
 *
 * Copyright (c) 2013-2014 Vlad Stirbu <vlad.stirbu@ieee.org>
 * Available under the terms of the MIT License.
 *
 */

var cordova = require('cordova');

var GamepadPlugin = function (window, navigator) {
  var _gamepads = [],
      _indeces = [];

  function timestamp() {
    // Older Android WebView might not support performance
    //return performance.now ? performance.now() : Date.now();
    return Date.now();
  }

  function GamepadButton() {
    return {
      pressed: false,
      value: 0
    };
  }

  function Gamepad(options) {
    var result = {
      id: options.id || 'builtin',
      index: options.index || 0,
      connected: true,
      timestamp: timestamp(),
      mapping: 'standard',
      axes: [0, 0, 0, 0],
      buttons: Array.apply(0, Array(17)).map(function () {
        return GamepadButton();
      })
    };

    return result;
  }

  function getGamepads() {
    var result = [];

    _gamepads.forEach(function (value) {
      if (value && value.connected) {
        result.push(value);
      }
    });

    return result;
  }

  function getNextAvailableIndex() {
    var result,
        available = false;

    available = _indeces.some(function (value, index) {
      if (!value) {
        result = index;
        _indeces[index] = true;
        return true;
      }
    });

    if (!available) {
      _indeces.push(true);
      result = _indeces.length - 1;
    }

    return result;
  }

  function isNewGamepad() {
    return !_gamepads.length;
  }

  function addGamepad() {
    var index = getNextAvailableIndex(),
        gamepad;

    gamepad = Gamepad({
      index: index
    });

    if (index === _gamepads.length) {
      _gamepads.push(gamepad);
    } else {
      _gamepads[index] = gamepad;
    }
  }

  function connectGamepad(e) {
    var index = 0;
    if (isNewGamepad(e)) {
      addGamepad(e);
      //console.log('gamepad added');

      cordova.fireWindowEvent('gamepadconnected', {
        gamepad: _gamepads[index]
      });
    }
  }

  function buttonHandler(e, pressed) {
    connectGamepad(e);
    var index = 0;
    // update gamepad
    if (_gamepads[index].buttons[e.button].pressed !== pressed) {
      _gamepads[index].buttons[e.button].pressed = pressed;
      _gamepads[index].buttons[e.button].value = pressed ? 1 : 0;
      _gamepads[index].buttons.timestamp = timestamp();

      cordova.fireWindowEvent('gamepadbutton', {
        button: e.button,
        gamepad: _gamepads[index]
      });
    }
  }

  function axisHandler(e) {
    connectGamepad(e);
    var index = 0;
    var threshold = 0.5;
    _gamepads[index].axes[0] = e.x;
    _gamepads[index].axes[1] = e.y;
    _gamepads[index].axes[2] = e.rx;
    _gamepads[index].axes[3] = e.ry;

    if (e.yaxis === 0) {
      _gamepads[index].buttons[12].pressed = false;
      _gamepads[index].buttons[13].pressed = false;
    } else if (e.yaxis < -threshold) {
      _gamepads[index].buttons[12].pressed = true;    // dpad up
    } else if (e.yaxis > threshold) {
      _gamepads[index].buttons[13].pressed = true;    // dpad down
    }
    if (e.xaxis === 0) {
      _gamepads[index].buttons[14].pressed = false;
      _gamepads[index].buttons[15].pressed = false;
    } else if (e.xaxis < -threshold) {
      _gamepads[index].buttons[14].pressed = true;    // dpad left
    } else if (e.xaxis > threshold) {
      _gamepads[index].buttons[15].pressed = true;    // dpad right
    }
  }

  /*
    * Register gamepad events callback as soon as the device is ready
    */
  window.document.addEventListener('deviceready', function () {
    cordova.exec(function (e) {
      switch (e.type) {
      case 'GamepadButtonDown':
        buttonHandler(e, true);
        break;
      case 'GamepadButtonUp':
        buttonHandler(e, false);
        break;
      case 'MotionEvent':
        axisHandler(e);
        break;
      default:
      }
    }, function () {
      // error callback
    }, 'Gamepad', 'register', []);
  }, false);

  navigator.getGamepads = getGamepads;
  console.log('GamepadButtons plugin initialized');
};

var gamepad = new GamepadPlugin(window, navigator);

module.exports = gamepad;

});
