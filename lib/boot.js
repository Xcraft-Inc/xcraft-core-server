'use strict';

var moduleName = 'boot';

var path = require ('path');

var xBus         = require ('xcraft-core-bus');
var busClient    = require ('xcraft-core-busclient');
var xLog         = require ('xcraft-core-log') (moduleName);
var xPlatform    = require ('xcraft-core-platform');
var xcraftConfig = require ('xcraft-core-etc').load ('xcraft');

var bootEnv = function () {
  var list = process.env.PATH.split (path.delimiter);

  /* With Windows, we must find cmd.exe or the exec() function fails.
   * It should not be necessary on Unix because it is always related to
   * /bin/sh which is absolute.
   * This section drops all unrelated path too.
   */
  if (process.env.COMSPEC !== undefined) {
    var systemDir = path.dirname (process.env.COMSPEC).replace (/\\/g, '\\\\');

    if (systemDir.length) {
      var regex = new RegExp ('^' + systemDir, 'i');

      list = list.filter (function (location) {
        return regex.test (location);
      });
    }
  }

  if (xcraftConfig.hasOwnProperty ('path')) {
    xcraftConfig.path.reverse ().forEach (function (location) {
      list.unshift (location);
    });
  }

  var arch = xPlatform.getToolchainArch ();
  list.unshift (path.resolve ('./usr/bin'));
  list.unshift (path.resolve ('.'));
  list.unshift (path.resolve ('./node_modules/.bin'));
  list.unshift (path.join (xcraftConfig.pkgTargetRoot, arch, 'usr/bin'));
  list.unshift (path.join (xcraftConfig.pkgTargetRoot, arch, 'bin'));

  process.env.PATH = list.join (path.delimiter);
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
