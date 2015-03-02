'use strict';

var moduleName = 'boot';

var path = require ('path');

var xBus         = require ('xcraft-core-bus');
var busClient    = require ('xcraft-core-busclient');
var xLog         = require ('xcraft-core-log') (moduleName);
var xPlatform    = require ('xcraft-core-platform');
var xcraftConfig = require ('xcraft-core-etc').load ('xcraft');
var xPath        = require ('xcraft-core-path');

var bootEnv = function () {
  if (xcraftConfig.hasOwnProperty ('path')) {
    xcraftConfig.path.reverse ().forEach (function (location) {
      xPath.unshift (location);
    });
  }

  var arch = xPlatform.getToolchainArch ();
  xPath.unshift (path.resolve ('./usr/bin'));
  xPath.unshift (path.resolve ('.'));
  xPath.unshift (path.resolve ('./node_modules/.bin'));
  xPath.unshift (path.join (xcraftConfig.pkgTargetRoot, arch, 'usr/bin'));
  xPath.unshift (path.join (xcraftConfig.pkgTargetRoot, arch, 'bin'));

  xLog.verb ('Xcraft environment ready');
};

xBus.getEmitter.on ('stop', function () {
  xLog.verb ('Bus stop event received');
});

exports.start = function (callback) {
  bootEnv ();

  xBus.getEmitter.on ('ready', function () {
    busClient.connect (xBus.getToken (), callback);
  });

  var commandHandlers = [];
  var xFs = require ('xcraft-core-fs');
  xFs.ls (xcraftConfig.nodeModulesRoot, /^xcraft-(core|contrib).*/).forEach (function (item) {
    commandHandlers.push ({
      path: path.dirname (require.resolve (item)),
      pattern: /.*\.js$/
    });
  });

  xBus.boot (commandHandlers);
};

exports.stop = function () {
  busClient.stop (function (err) { /* jshint ignore:line */
    xBus.stop ();
  });
};

exports.busClient = busClient;
exports.bus = xBus;
