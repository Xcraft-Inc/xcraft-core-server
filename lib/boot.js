'use strict';

var moduleName = 'boot';

var bus          = require ('xcraft-core-bus');
var busClient    = require ('xcraft-core-busclient');
var xLog         = require ('xcraft-core-log') (moduleName);
var xcraftConfig = require ('xcraft-core-etc').load ('xcraft');

var bootEnv = function () {
  var path = require ('path');

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

  list.unshift (path.resolve ('./usr/bin'));
  list.unshift (path.join (xcraftConfig.pkgTargetRoot, 'usr/bin'));
  list.unshift (path.join (xcraftConfig.pkgTargetRoot, 'bin'));

  process.env.PATH = list.join (path.delimiter);
  xLog.verb ('Xcraft environment ready');
};

bus.getEmitter.on ('stop', function () {
  xLog.verb ('Bus stop event received');
});

exports.start = function (callbackDone) {
  var path = require ('path');
  bootEnv ();

  bus.getEmitter.on ('ready', function () {
    busClient.connect (bus.getToken (), callbackDone);
  });

  var commandHandlers = [];
  var xFs = require ('xcraft-core-fs');
  xFs.ls (xcraftConfig.nodeModules, /^xcraft-(core|contrib).*/).forEach (function (item) {
    commandHandlers.push ({
      path: path.join (xcraftConfig.nodeModules, item),
      pattern: /.*\.js$/
    });
  });

  bus.boot (commandHandlers);
};

exports.stop = function () {
  busClient.stop (function (done) { /* jshint ignore:line */
    bus.stop ();
  });
};

exports.busClient = busClient;
exports.bus = bus;
