/**
 * Universal Cordova Bridge
 * 
 * This file provides overrides for Cordova functionality
 * to prevent ALL prompt() dialogs and exec() calls.
 * 
 * This bridge file should be loaded before cordova.js.
 */

(function() {
    'use strict';
    
    console.log('Cordova Bridge: Initializing universal overrides');
    
    // Override window.prompt IMMEDIATELY to block ALL gap-related prompts
    var originalPrompt = window.prompt;
    window.prompt = function(message, defaultText) {
        // Block ALL gap-related prompts without any conditions
        if (typeof defaultText === 'string' && 
            (defaultText.indexOf('gap:') === 0 || 
             defaultText.indexOf('gap_init:') === 0 ||
             defaultText.indexOf('gap_bridge_mode:') === 0 ||
             defaultText.indexOf('gap_poll:') === 0)) {
            console.log('Cordova Bridge: BLOCKED prompt: ' + defaultText);
            return ''; // 返回空字符串而不是null
        }
        // Allow other prompts to proceed
        if (originalPrompt) {
            return originalPrompt.apply(window, arguments);
        }
        return '';
    };
    
    // Wait for cordova to be available
    function initializeBridge() {
        if (typeof cordova === 'undefined') {
            setTimeout(initializeBridge, 50);
            return;
        }
        
        // Override cordova.exec to prevent Android-specific exec calls
        if (cordova.exec) {
            var originalExec = cordova.exec;
            cordova.exec = function(success, fail, service, action, args) {
                // Silently fail on iOS for Android-specific services
                if (service === 'CoreAndroid' || service === 'App' || 
                    service === 'File' || service === 'CordovaSplashScreenPlugin') {
                    console.log('iOS Cordova Bridge: Blocked exec call to ' + service + '.' + action);
                    if (fail && typeof fail === 'function') {
                        setTimeout(function() {
                            fail({ code: -1, message: 'Not supported on iOS' });
                        }, 0);
                    }
                    return;
                }
                // Allow other exec calls to proceed
                return originalExec.apply(cordova, arguments);
            };
            console.log('iOS Cordova Bridge: Overrode cordova.exec');
        }
        
        // Override platform bootstrap to skip Android-specific initialization
        if (typeof require !== 'undefined') {
            try {
                var platform = require('cordova/platform');
                if (platform && platform.bootstrap) {
                    var originalBootstrap = platform.bootstrap;
                    platform.bootstrap = function() {
                        console.log('iOS Cordova Bridge: Skipping Android bootstrap');
                        var channel = require('cordova/channel');
                        channel.onNativeReady.fire();
                        return;
                    };
                    console.log('iOS Cordova Bridge: Overrode platform.bootstrap');
                }
            } catch (e) {
                // Platform module might not be available yet
            }
        }
        
        // Override onCordovaReady to skip Android-specific exec calls
        if (typeof require !== 'undefined') {
            try {
                var channel = require('cordova/channel');
                if (channel && channel.onCordovaReady) {
                    // Subscribe with high priority to run before Android code
                    channel.onCordovaReady.subscribe(function() {
                        console.log('iOS Cordova Bridge: onCordovaReady fired, skipping Android exec calls');
                        // Don't call Android-specific exec functions
                        // The original subscribe will be blocked by our exec override
                    }, true);
                    console.log('iOS Cordova Bridge: Subscribed to onCordovaReady');
                }
            } catch (e) {
                // Channel might not be available yet
            }
        }
        
        // Override fileSystemPaths plugin
        if (typeof require !== 'undefined') {
            try {
                var fileSystemPaths = require('cordova-plugin-file.fileSystemPaths');
                if (fileSystemPaths && fileSystemPaths.file) {
                    // Set default iOS paths
                    fileSystemPaths.file.applicationDirectory = 'file:///';
                    fileSystemPaths.file.applicationStorageDirectory = 'file:///';
                    fileSystemPaths.file.dataDirectory = 'file:///';
                    fileSystemPaths.file.cacheDirectory = 'file:///';
                    fileSystemPaths.file.tempDirectory = 'file:///';
                    fileSystemPaths.file.syncedDataDirectory = 'file:///';
                    fileSystemPaths.file.documentsDirectory = 'file:///';
                    
                    var channel = require('cordova/channel');
                    if (channel && channel.initializationComplete) {
                        channel.initializationComplete('onFileSystemPathsReady');
                    }
                    console.log('iOS Cordova Bridge: Set default file system paths');
                }
            } catch (e) {
                // File system paths module might not be available yet, try again later
                setTimeout(function() {
                    try {
                        var fileSystemPaths = require('cordova-plugin-file.fileSystemPaths');
                        if (fileSystemPaths && fileSystemPaths.file) {
                            fileSystemPaths.file.applicationDirectory = 'file:///';
                            fileSystemPaths.file.applicationStorageDirectory = 'file:///';
                            fileSystemPaths.file.dataDirectory = 'file:///';
                            fileSystemPaths.file.cacheDirectory = 'file:///';
                            fileSystemPaths.file.tempDirectory = 'file:///';
                            fileSystemPaths.file.syncedDataDirectory = 'file:///';
                            fileSystemPaths.file.documentsDirectory = 'file:///';
                            
                            var channel = require('cordova/channel');
                            if (channel && channel.initializationComplete) {
                                channel.initializationComplete('onFileSystemPathsReady');
                            }
                            console.log('iOS Cordova Bridge: Set default file system paths (delayed)');
                        }
                    } catch (e2) {
                        // Still not available
                    }
                }, 500);
            }
        }
        
        console.log('iOS Cordova Bridge: Initialization complete');
    }
    
    // Start initialization immediately and also wait for DOM
    initializeBridge();
    if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
        document.addEventListener('DOMContentLoaded', initializeBridge);
    }
})();
